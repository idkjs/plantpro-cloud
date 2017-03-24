module StdList = struct
  include List
end

open Opium.Std
open Lwt.Infix
open CalendarLib

module List = struct
  include StdList
end

(*let service_get_oauth = get "/" (fun req ->
  Cohttp_lwt_body.to_string
    req.Opium_rock.Request.body
  >>= fun body ->
  `String ("received request \"" ^ body ^ "\"")
  |> respond')*)

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
  if password1 <> password2
  then respond' (`String ("passwords do not match: " ^ username))
  else begin
    match%lwt Db.get_user username with
      | Some _ ->
          respond'
            ~headers:(Cohttp.Header.init_with "Location" "/static/index.html#failed")
            ~code:(`Moved_permanently)
            (`String ("Error: User " ^ username ^ " already exists"))
      | None ->
          let user =
            User.create username "none@example.com" password1
          in
          let%lwt res = Db.add_user user in
          respond'
            (`String
              (Printf.sprintf
                "created user with ID %d"
                (Int64.to_int res)))
  end)

let service_login = post "/login" (fun req ->
  Cohttp_lwt_body.to_string
    req.Opium_rock.Request.body
  >>= fun body ->
  let params = Fuck_stdlib.get_post_params body in
  let _, username =
    List.find
      (fun (name, _) -> name = "username")
      params
  in
  let _, password =
    List.find
      (fun (name, _) -> name = "password")
      params
  in
  let%lwt user = Db.get_user username in
  match user with
    | Some u ->
        begin match User.check username password u with
          | `Ok ->
              let session =
                Session.create username
              in
              let lifetime = Int64.of_int Session.lifetime in
              let cookie =
                Cohttp.Cookie.Set_cookie_hdr.make
                  ~expiration:(`Max_age (lifetime))
                  ~secure:false
                  ("auth_token", session.auth_token)
              in
              let cookie' =
                Cohttp.Cookie.Set_cookie_hdr.make
                  ~expiration:(`Max_age (lifetime))
                  ~secure:false
                  ("username", session.user)
              in
              let headers =
                let k, v = Cohttp.Cookie.Set_cookie_hdr.serialize cookie in
                Cohttp.Header.(add (init_with k v) k v)
              in
              redirect'
                ~headers
                (Uri.of_string "/static/controlpanel/dashboard.html")
          | `Nope ->
              redirect'
                (Uri.of_string "/static/index.html#bad-pass")
        end
    | None ->
        redirect'
          (Uri.of_string "/static/index.html#not-found"))

let service_get_user_devices = get "/get-devices/:username" (fun req ->
  let username = param req "username" in
  let%lwt devices = Db.get_devices username in
  let devices =
    [%to_yojson: Device.t list] devices
    |> Yojson.Safe.to_string
  in
  `Json (Ezjsonm.from_string devices)
  |> respond')

let service_associate_device = post "/associate-device" (fun req ->
  Cohttp_lwt_body.to_string
    req.Opium_rock.Request.body
  >>= fun body ->
  let params = Fuck_stdlib.get_post_params body in
  let username =
    Cohttp.Cookie.Set_cookie_hdr.(
      Request.headers req
      |> extract
      |> List.find (fun (name, _) -> name = "username")
      |> snd
      |> value)
  in
  let _, device =
    List.find
      (fun (name, _) -> name = "device")
      params
  in
  let _, name =
    List.find
      (fun (name, _) -> name = "name")
      params
  in
  let%lwt res = Db.associate_device username device name in
  match Int64.to_int res with
    | 1 ->
        respond' (`String "Successfully associated user")
    | _ ->
        respond' (`String "Error: device association unsuccessful"))

let service_push_data = post "/push-data" (fun req ->
  Cohttp_lwt_body.to_string
    req.Opium_rock.Request.body
  >>= fun body ->
  let packet =
    Yojson.Safe.from_string body
    |> Device.data_packet_of_yojson
  in
  let open Result in
  match packet with
    | Ok packet ->
        let%lwt _ =
          Db.add_data
            (Calendar.now ())
            packet.Device.device
            packet.Device.payload.sclass
            packet.Device.payload.value
        in
        `String "OK"
        |> respond'
    | Error _ ->
        raise (Failure "MALFORMED JSON");)

(*let auth_static =
  let filter handler req =
    let headers = Request.headers req in
    let auth_token =
      Cohttp.Cookie.Set_cookie_hdr.(
        extract headers
        |> List.find (fun (name, _) -> name = "auth_token")
        |> snd
        |> value)
    in
    let username =
      Cohttp.Cookie.Set_cookie_hdr.(
        extract headers
        |> List.find (fun (name, _) -> name = "name")
        |> snd
        |> value)
    in
    let is_secure =
      try
        Cohttp.Request.uri req.request
        |> Uri.path
        |> String.substr_index ~pattern:"/secure/"
        |> Option.is_some
      with
        | Not_found -> false
    in
    match Session.check username auth_token, is_secure with
      | `Expired, true ->
        redirect'
          (Uri.of_string "/static/login.html#session-expired")
      | `Nope, true ->
        redirect'
          (Uri.of_string "/static/login.html#bad-auth")
      | `Ok, true
      | `Nope, false
      | `Expired, false ->
          Printf.printf "Handling with normal handler\n";
          handler req
  in
  Rock.Middleware.create ~filter*)

let _ =
  let plantpi_handle_signal = function
    | 2 | 3 | 9 | 15 | -6 ->
        ignore(
          print_endline "Handling signal.";
          Lwt_main.run (Db.close_db());
          exit 0)
    | n ->
        Printf.printf "Handling another signal: %d\n" n;
        print_endline "Some other signal.";
  in
  Sys.(
    set_signal 2 (Signal_handle plantpi_handle_signal);
    set_signal 3 (Signal_handle plantpi_handle_signal);
    set_signal 15 (Signal_handle plantpi_handle_signal););
  let static =
    Middleware.static ~local_path:"../client" ~uri_prefix:"/static"
  in
  App.empty
  |> service_create_account
  |> service_login
  |> service_push_data
  |> service_associate_device
  |> service_get_user_devices
  |> middleware static
  |> App.run_command
