module StdList = struct
  include List
end

open Opium.Std
open Lwt.Infix

module List = struct
  include StdList
end

let service_get_oauth = get "/" (fun req ->
  Cohttp_lwt_body.to_string
    req.Opium_rock.Request.body
  >>= fun body ->
  `String ("received request \"" ^ body ^ "\"")
  |> respond')

let service_create_account = post "/create-account" (fun req ->
  Cohttp_lwt_body.to_string
    req.Opium_rock.Request.body
  >>= fun body ->
  let params = Fuck_stdlib.get_post_params body in
  let _, username =
    List.find
      (fun (name, _) -> name = "username")
      params
  in
  let _, password1 =
    List.find
      (fun (name, _) -> name = "password1")
      params
  in
  let _, password2 =
    List.find
      (fun (name, _) -> name = "password2")
      params
  in
  let resp =
    if password1 <> password2
    then `String ("passwords do not match you cuck " ^ username)
    else `String ("received request \"" ^ body ^ "\"")
  in
  respond' resp)

let _ =
  let static =
    Middleware.static ~local_path:"../client" ~uri_prefix:"/static"
  in
  App.empty
  |> service_get_oauth
  |> service_create_account
  |> middleware static
  |> App.run_command
