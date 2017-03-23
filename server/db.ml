(*module Sqlexpr = Sqlexpr_sqlite.Make(Sqlexpr_concurrency.Id)
module S = Sqlexpr*)
module Sqlexpr = Sqlexpr_sqlite_lwt
module S = Sqlexpr

open Lwt
open Lwt.Infix

let db =
  S.open_db "PlantPi.db"

(*let _ =
  let make_users () =
    S.execute
      db
      [%sqlc
        "CREATE TABLE users ( \
          id SERIAL PRIMARY KEY, \
          creation_time VARCHAR(256), \
          name VARCHAR(256), \
          email VARCHAR(256), \
          salt VARCHAR(256), \
          p_hash VARCHAR(256))"];
  in
  let make_plant_data () =
    S.execute
      db
      [%sqlc
        "CREATE TABLE px ( \
          id SERIAL PRIMARY KEY, \
          time VARCHAR(256), \
          sensor_type INTEGER, \
          value VARCHAR(512))"];
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
      match%lwt S.select_one_maybe db [%sqlc "SELECT @s{time} FROM px"] with
      | Some _ ->
          Lwt_io.printf "px table already exists\n"
      | None ->
          make_plant_data()
    with
      | _ -> make_plant_data())*)

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

let close_db () =
  Lwt.return(S.close_db db)
