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
          p_hash VARCHAR(256) NOT NULL)"];
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
          device_id PRIMARY KEY NOT NULL, \
          user_id TEXT NOT NULL, \
          name TEXT NOT NULL, \
          FOREIGN KEY(user_id) REFERENCES users(id))"];
  in
  Lwt_main.run(
    try%lwt
      match%lwt S.select_one_maybe db [%sqlc "SELECT @s{name} FROM users"] with
        | Some _ ->
            Lwt_io.printf "users table already exists\n"
        | None ->
            make_users ()
    with
      | _ -> make_users()
    >>= fun () ->
    try%lwt
      match%lwt S.select_one_maybe db [%sqlc "SELECT @d{device_id} FROM devices"] with
        | Some _ ->
            Lwt_io.printf "devices table already exists\n"
        | None ->
            make_devices ()
    with
      | _ -> make_users()
    >>= fun () ->
    try%lwt
      match%lwt S.select_one_maybe db [%sqlc "SELECT @s{time} FROM px"] with
      | Some _ ->
          Lwt_io.printf "px table already exists\n"
      | None ->
          make_plant_data()
    with
      | _ -> make_plant_data())

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

let get_data device =
  let id = device.Device.id in
  S.select_f
    db
    (fun (time, sensor_type, value) ->
      let time = CalendarLib.Printer.Calendar.from_string time in
      match sensor_type with
        | "jeffrey" ->
            Lwt.return (Device.Jeffrey (float_of_string value, time))
        | _ ->
            raise (Failure ("invalid sensor type found in database: \"" ^ sensor_type ^ "\"")))
    [%sqlc "SELECT @s{time}, @s{sensor_type}, @s{value} FROM px WHERE device_id = %s"]
    id

let close_db () =
  Lwt.return(S.close_db db)
