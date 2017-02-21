open Opium.Std
open Lwt.Infix

let service_get_oauth = get "/" (fun req ->
  `String "not yet implemented"
  |> respond')

let _ =
  let static =
    Middleware.static ~local_path:"../client" ~uri_prefix:"/static"
  in
  App.empty
  |> service_get_oauth
  |> middleware static
  |> App.run_command
