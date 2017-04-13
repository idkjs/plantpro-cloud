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
          FOREIGN KEY(user_id) REFERENCES users(id))"];
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
    Some (
      User.{
          creation_time
        ; name
        ; email
        ; salt
        ; p_hash
        })
  with
    | Not_found ->
        Lwt.return None

let get_user_id uname =
  S.select_one_maybe
    db
    [%sqlc
      "SELECT \
          @d{id} \
        FROM users WHERE name = %s"]
    uname

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

(*let get_group_by_name name user =
  S.select_f
    db
    (fun (id, name, owner_id) ->
      Lwt.return
        Group.({name = name; id = id; owner_id = owner_id}))
    [%sqlc "SELECT (id, name, owner_id) \
            FROM groups \
            WHERE (name = %s \
            AND owner_id = %d)"]
    name
    user.User.id*)

let get_groups user =
  let%lwt user_id = get_user_id user in
  match user_id with
    | None ->
        raise (Failure "Trying to get groups from a nonexistant user")
    | Some user_id ->
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
  match user_id with
    | None ->
        raise (Failure "Trying to create a group with a nonexistant user")
    | Some user_id ->
        S.insert
          db
          [%sqlc "INSERT INTO groups(name, owner_id) \
                  VALUES(%s, %d)"]
          name
          user_id

let associate_device user device name =
  let open User in
  let%lwt id = get_user_id user in
  match id with
    | Some id ->
        S.insert
          db
          [%sqlc "INSERT INTO devices(user_id, device_id, name) VALUES(%d, %s, %s)"]
          id
          device
          name
    | None ->
        raise (Failure "trying to associate a device with a nonexistent user")

let get_devices user : Device.t list Lwt.t =
  let%lwt id = get_user_id user in
  match id with
    | Some id ->
        S.select_f
          db
          (fun (id, name) ->
            Lwt.return Device.{id = id; name = name})
          [%sqlc "SELECT @s{device_id}, @s{name} FROM devices WHERE user_id = %d"]
          id
    | None ->
        raise (Failure "trying to get devices for a nonexistent user")

let get_device_by_name name =
  S.select_one_f_maybe
    db
    (fun (id, name) -> Lwt.return Device.{id; name})
    [%sqlc "SELECT @s{device_id}, @s{name} FROM devices WHERE name = %s"]
    name

let get_data device =
  let id = device.Device.id in
  S.select_f
    db
    (fun (time, sensor_type, value) ->
      let time = CalendarLib.Printer.Calendar.from_string time in
      match sensor_type with
        | "temp" ->
            Lwt.return (Device.Jeffrey (float_of_string value, time))
        | _ ->
            raise (Failure ("invalid sensor type found in database: \"" ^ sensor_type ^ "\"")))
    [%sqlc "SELECT @s{time}, @s{sensor_type}, @s{value} FROM px WHERE device_id = %s"]
    id

let close_db () =
  Lwt.return(S.close_db db)
