(*module Sqlexpr = Sqlexpr_sqlite.Make(Sqlexpr_concurrency.Id)
module S = Sqlexpr*)
module Sqlexpr = Sqlexpr_sqlite_lwt
module S = Sqlexpr

open Lwt
open Lwt.Infix

let db =
  S.open_db "PlantPi.db"

let _ =
  let make_users () =
    S.execute
      db
      [%sqlc
        "CREATE TABLE IF NOT EXISTS users ( \
          id INTEGER PRIMARY KEY AUTOINCREMENT, \
          creation_time VARCHAR(256) NOT NULL, \
          name VARCHAR(256) NOT NULL, \
          email VARCHAR(256) NOT NULL, \
          salt VARCHAR(256) NOT NULL, \
          p_hash TEXT NOT NULL)"];
  in
  let make_plant_data () =
    S.execute
      db
      [%sqlc
        "CREATE TABLE IF NOT EXISTS px ( \
          id SERIAL PRIMARY KEY, \
          time VARCHAR(256) NOT NULL, \
          sensor_type TEXT NOT NULL, \
          device_id TEXT NOT NULL, \
          value VARCHAR(512) NOT NULL,
          FOREIGN KEY(device_id) REFERENCES devices(device_id))"];
  in
  let make_devices () =
    S.execute
      db
      [%sqlc
        "CREATE TABLE IF NOT EXISTS devices ( \
          device_id TEXT PRIMARY KEY NOT NULL, \
          user_id TEXT NOT NULL, \
          name TEXT NOT NULL, \
          group_id INTEGER, \
          FOREIGN KEY(group_id) REFERENCES groups(id), \
          FOREIGN KEY(user_id) REFERENCES users(id), \
          UNIQUE(name, user_id))"];
  in
  let make_groups () =
    S.execute
      db
      [%sqlc
        "CREATE TABLE IF NOT EXISTS groups ( \
          id INTEGER PRIMARY KEY AUTOINCREMENT, \
          name TEXT NOT NULL, \
          owner_id INTEGER NOT NULL, \
          FOREIGN KEY(owner_id) REFERENCES users(id), \
          UNIQUE(owner_id, name));"];
  in
  Lwt_main.run(
    make_users ()
    >>= fun _ ->
    make_devices ()
    >>= fun _ ->
    make_plant_data ()
    >>= fun _ ->
    make_groups ())

let get_user uname =
  try%lwt
    S.select_one
      db
      [%sqlc
        "SELECT \
            @s{creation_time} \
          , @s{name} \
          , @s{email} \
          , @s{salt} \
          , @s{p_hash} \
          FROM users WHERE name = %s"]
      uname
    >|= fun (creation_time', name, email, salt, p_hash) ->
    let creation_time =
      CalendarLib.Printer.Calendar.from_string creation_time'
    in
    User.{
        creation_time
      ; name
      ; email
      ; salt
      ; p_hash
      }
  with
    | Not_found ->
        raise (Failure "Couldn't find a user with the username")

let get_user_id uname =
  let%lwt id =
    S.select_one_maybe
      db
      [%sqlc
        "SELECT \
            @d{id} \
          FROM users WHERE name = %s"]
      uname
  in
  match id with
    | Some id ->
        Lwt.return id
    | None ->
        raise (Not_found)

let add_user user =
  let open User in
  let creation_time, name, email, salt, p_hash =
    user.creation_time, user.name, user.email, user.salt, user.p_hash
  in
  S.insert
    db
    [%sqlc "INSERT INTO users(creation_time, name, email, salt, p_hash) \
            VALUES(%s, %s, %s, %s, %s)"]
    (CalendarLib.Printer.Calendar.to_string creation_time)
    name
    email
    salt
    p_hash

let add_data time device_id sensor_type value =
  S.insert
    db
    [%sqlc "INSERT INTO px(time, device_id, sensor_type, value) \
            VALUES(%s, %s, %s, %s)"]
    (CalendarLib.Printer.Calendar.to_string time)
    device_id
    sensor_type
    value

let get_group_by_name name user =
  let%lwt user_id =
    get_user_id user.User.name
  in
  let%lwt res =
    S.select_f
      db
      (fun (id, name, owner_id) ->
        Lwt.return
          Group.({name = name; id = id; owner_id = owner_id}))
      [%sqlc "SELECT @d{id}, @s{name}, @d{owner_id} \
              FROM groups \
              WHERE (name = %s \
              AND owner_id = %d)"]
      name
      user_id
  in
  match res with
    | [el] ->
        Lwt.return el
    | _ ->
        raise (Failure ("ERROR: user " ^ user.User.name ^ " has more than one group named " ^ name))

let get_group_by_id id =
  let%lwt res =
    S.select_f
      db
      (fun (id, name, owner_id) ->
        Lwt.return
          Group.(
            {name = name; id = id; owner_id = owner_id}))
      [%sqlc "SELECT @d{id}, @s{name}, @d{owner_id} FROM groups WHERE id = %d"]
      id
  in
  match res with
    | [el] ->
        Lwt.return el
    | _ ->
        raise (Failure "something has gone catastrophically wrong")

let rename_group id new_name =
  let%lwt group = get_group_by_id id in
  match group with
    | group ->
        S.insert
          db
          [%sqlc "UPDATE groups SET name = %s WHERE id = %d"]
          new_name
          id
    | exception e ->
        raise Not_found

let get_groups user =
  let%lwt user_id = get_user_id user in
      S.select_f
        db
        (fun (id, name, owner_id) ->
          Lwt.return
            Group.(
              {name = name; id = id; owner_id = owner_id}))
        [%sqlc "SELECT @d{id}, @s{name}, @d{owner_id} FROM groups WHERE owner_id = %d"]
        user_id

let add_group name user =
  let%lwt user_id = get_user_id user in
  S.insert
    db
    [%sqlc "INSERT INTO groups(name, owner_id) \
            VALUES(%s, %d)"]
    name
    user_id

let add_device_to_group device group =
  let device_id = device.Device.id in
  match group with
    | Some group ->
        let group_id = group.Group.id in
        S.insert
          db
          [%sqlc
            "UPDATE devices
              SET group_id = %d
              WHERE device_id = %s"]
          group_id
          device_id
    | None ->
        S.insert
          db
          [%sqlc
            "UPDATE devices
              SET group_id = NULL
              WHERE device_id = %s"]
          device_id

let get_devices_by_group group =
  S.select_f
    db
    (fun (id, name, group_id) ->
      let%lwt group =
        match group_id with
          | Some group_id ->
              let%lwt x = get_group_by_id group_id in
              Lwt.return (Some x)
          | None ->
              Lwt.return None
      in
      Lwt.return Device.{id; name; group})
    [%sqlc "SELECT @s{device_id}, @s{name}, @d?{group_id} FROM devices WHERE group_id = %d"]
    group.Group.id

let delete_group group =
  S.execute
    db
    [%sqlc "DELETE FROM groups WHERE id = %d"]
    group.Group.id

let associate_device user device name =
  let open User in
  let%lwt id = get_user_id user in
  S.insert
    db
    [%sqlc "INSERT INTO devices(user_id, device_id, name) VALUES(%d, %s, %s)"]
    id
    (B64.decode device)
    name

let get_devices user : Device.t list Lwt.t =
  let%lwt id = get_user_id user in
  S.select_f
    db
    (fun (id, name, group_id) ->
      match group_id with
        | Some group_id ->
            let%lwt group = get_group_by_id group_id in
            Lwt.return Device.{id = id; name = name; group = Some group}
        | None ->
            Lwt.return Device.{id = id; name = name; group = None})
    [%sqlc "SELECT @s{device_id}, @s{name}, @d?{group_id} FROM devices WHERE user_id = %d"]
    id

let get_device_by_name name =
  S.select_one_f_maybe
    db
    (fun (id, name, group_id) -> 
      let%lwt group =
        match group_id with
          | Some group_id ->
              let%lwt group = get_group_by_id group_id in
              Lwt.return (Some group)
          | None ->
              Lwt.return None
      in
      Lwt.return Device.{id; name; group})
    [%sqlc "SELECT @s{device_id}, @s{name}, @d?{group_id} FROM devices WHERE name = %s"]
    name

let get_device_by_id id =
  S.select_one_f_maybe
    db
    (fun (id, name, group_id) -> 
      let%lwt group =
        match group_id with
          | Some group_id ->
              let%lwt group = get_group_by_id group_id in
              Lwt.return (Some group)
          | None ->
              Lwt.return None
      in
      Lwt.return Device.{id; name; group})
    [%sqlc "SELECT @s{device_id}, @s{name}, @d?{group_id} FROM devices WHERE device_id = %s"]
    id

let get_data device =
  let id = device.Device.id in
  S.select_f
    db
    (fun (time, sensor_type, value) ->
      let time = CalendarLib.Printer.Calendar.from_string time in
      match sensor_type with
        | "ChirpTemp" ->
            Lwt.return (Device.(ChirpTemp (float_of_string value, (ttype_of_string sensor_type), time)))
        | _ ->
            raise (Failure ("invalid sensor type found in database: \"" ^ sensor_type ^ "\"")))
    [%sqlc "SELECT @s{time}, @s{sensor_type}, @s{value} FROM px WHERE device_id = %s"]
    id

let close_db () =
  Lwt.return(S.close_db db)
