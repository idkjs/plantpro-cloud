module Std_list = struct
  include List
end

open Opium.Std
open Lwt.Infix
open CalendarLib

module List = struct
  include Std_list
end

let _ =
  let open Email in
  ()

let create_account_handler = (fun req ->
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
  let _, email =
    List.find
      (fun (name, _) -> name = "email")
      params
  in
  if password1 <> password2
  then respond' (`String ("passwords do not match: " ^ username))
  else begin
    try%lwt
      let%lwt _ = Db.get_user username in
      respond'
        ~code:(`Conflict)
        (`String ("Error: User " ^ username ^ " already exists"))
    with
      | Sys.Break as exn
      | exn ->
          let user =
            User.create username email password1
          in
          let%lwt res = Db.add_user user in
          respond'
            (`String
              (Printf.sprintf
                "created user with ID %d"
                (Int64.to_int res)))
  end)

type create_group_request =
  { user: string
  ; groupName: string
  }
  [@@deriving yojson]

let create_group_handler = (fun req ->
  Cohttp_lwt_body.to_string
    req.Opium_rock.Request.body
  >>= fun body ->
  let {user = username; groupName = group_name} =
    Yojson.Safe.from_string body
    |> create_group_request_of_yojson
    |> function
      | Ok x -> x
      | Error _ -> raise (Failure "fuck")
  in
  (*let params = Fuck_stdlib.get_post_params body in
  let _, username =
    List.find
      (fun (name, _) -> name = "user")
      params
  in
  let _, group_name =
    List.find
      (fun (name, _) -> name = "groupName")
      params
  in*)
  let%lwt user = Db.get_user username in
  match%lwt Db.add_group group_name username with
    | res ->
        respond'
          (`String
            (Printf.sprintf
              "created group with ID %d"
              (Int64.to_int res)))
    | exception exn ->
        respond'
          ~code:(`Bad_request)
          (`String "Error"))

let login_handler = (fun req ->
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
  let%lwt u = Db.get_user username in
  begin match User.check username password u with
    | `Ok ->
        let session =
          Session.create username
        in
        let lifetime = Int64.of_int Session.lifetime in
        let cookie =
          Cohttp.Cookie.Set_cookie_hdr.make
            ~expiration:(`Max_age (lifetime))
            ~path:"/"
            ~secure:false
            ("auth_token", Encrypt.hex_encode session.auth_token)
        in
        let cookie' =
          Cohttp.Cookie.Set_cookie_hdr.make
            ~expiration:(`Max_age (lifetime))
            ~path:"/"
            ~secure:false
            ("username", Encrypt.hex_encode session.user)
        in
        let headers =
          let k, v = Cohttp.Cookie.Set_cookie_hdr.serialize cookie in
          let k', v' = Cohttp.Cookie.Set_cookie_hdr.serialize cookie' in
          Cohttp.Header.(add (init_with k v) k' v')
        in
        redirect'
          ~headers
          (Uri.of_string "/s/dashboard.html")
    | `Nope ->
        redirect'
          (Uri.of_string "/index.html")
  end)

let get_user_devices_handler = (fun req ->
  let username = param req "username" in
  let%lwt devices = Db.get_devices username in
  let%lwt devices =
    match param req "group" |> Netencoding.Url.decode with
      | "all" ->
          Lwt.return devices
      | "ungrouped" ->
          List.filter (fun dev -> dev.Device.group = None) devices
          |> Lwt.return
      | target_group_name ->
          let%lwt user = Db.get_user username in
          let%lwt group = Db.get_group_by_name target_group_name user in
          Lwt.return (
            List.filter
              (function
                | { Device.group = Some { name = group_name } } when group_name = target_group_name ->
                    true
                | _ ->
                    false)
              devices)
  in
  `Json ([%to_yojson: Device.t list] devices)
  |> respond')

let get_user_groups_handler = (fun req ->
  let username = param req "username" in
  let%lwt groups = Db.get_groups username in
  let groups =
    [%to_yojson: Group.t list] groups
  in
  `Json groups
  |> respond')

let try_unoption = function
  | Some x -> x
  | None -> raise (Failure "gambled and lost, mate *shrugs*")

type rename_group_parameters =
  { old_name: string
  ; new_name: string
  }
  [@@deriving yojson]

let rename_group_handler = (fun req ->
  let open Result in
  let%lwt body =
    Cohttp_lwt_body.to_string
      req.Opium_rock.Request.body
  in
  let Ok { old_name; new_name } =
    Yojson.Safe.from_string body
    |> rename_group_parameters_of_yojson
  in
  let username =
    match Cohttp.Header.get (Request.headers req) "Cookie" with
      | Some s ->
          Fuck_stdlib.get_post_params ~split_on:";" s
          |> List.find (fun (name, _) -> String.trim name = "username")
          |> snd
          |> Encrypt.hex_decode
      | None -> raise (Failure "could not get username from cookie")
  in
  let%lwt user = Db.get_user username in
  let%lwt group = Db.get_group_by_name old_name user in
  match%lwt Db.rename_group group.Group.id new_name with
    | _ ->
        respond' (`String "OK")
    | exception Not_found ->
        raise (Failure "renaming the group"))

let delete_group_handler = (fun req ->
  let open Result in
  let%lwt group_name =
    Cohttp_lwt_body.to_string
      req.Opium_rock.Request.body
  in
  let username =
    match Cohttp.Header.get (Request.headers req) "Cookie" with
      | Some s ->
          Fuck_stdlib.get_post_params ~split_on:";" s
          |> List.find (fun (name, _) -> String.trim name = "username")
          |> snd
          |> Encrypt.hex_decode
      | None -> raise (Failure "could not get username from cookie")
  in
  let%lwt user = Db.get_user username in
  let%lwt group = Db.get_group_by_name group_name user in
  let%lwt devices = Db.get_devices_by_group group in
  let%lwt () =
    Lwt_list.iter_p
      (fun device ->
        let%lwt _ = Db.add_device_to_group device None in
        Lwt.return ())
      devices
  in
  let%lwt () = Db.delete_group group in
  `String "OK"
  |> respond')

let try_unoption = function
  | Some x -> x
  | None -> raise (Failure "gambled and lost, mate *shrugs*")

let get_device_data_handler = (fun req ->
  let device_name = param req "device" in
  let%lwt device =
    Db.get_device_by_name device_name
  in
  let device = try_unoption device in
  let%lwt data = Db.get_data device in
  let res =
    [%to_yojson: Device.sensor_reading list] data
  in
  (*`String device.name*)
  `Json res
  |> respond')

let associate_device_handler = (fun req ->
  Cohttp_lwt_body.to_string
    req.Opium_rock.Request.body
  >>= fun body ->
  let params = Fuck_stdlib.get_post_params body in
  let username = "penis" in
  let username =
    match Cohttp.Header.get (Request.headers req) "Cookie" with
      | Some s ->
          Fuck_stdlib.get_post_params ~split_on:";" s
          (*|> List.fold_left (fun acc (name, x) -> acc ^ "<br />" ^ name ^ " " ^ x) ""*)
          |> List.find (fun (name, _) -> String.trim name = "username")
          |> snd
          |> Encrypt.hex_decode
      | None -> "no cookies"
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

type group_operation_request =
  { plant: string
  ; group: int option [@default None]
  }
[@@deriving yojson {strict = false}]

let move_group_handler = (fun req ->
  let%lwt body =
    Cohttp_lwt_body.to_string
      req.Opium_rock.Request.body
  in
  let params =
    match group_operation_request_of_yojson (Yojson.Safe.from_string body) with
      | Ok x ->
          x
      | Error s ->
          raise (
            Failure (
              Printf.sprintf
                "Problem decoding change-group parameters: %s"
                s))
  in
  let username =
    match Cohttp.Header.get (Request.headers req) "Cookie" with
      | Some s ->
          Fuck_stdlib.get_post_params ~split_on:";" s
          |> List.find (fun (name, _) -> String.trim name = "username")
          |> snd
          |> Encrypt.hex_decode
      | None -> "no cookies"
  in
  let%lwt Some(device) = Db.get_device_by_id params.plant in
  let%lwt group =
    match params.group with
      | Some x ->
          let%lwt g = Db.get_group_by_id x in
          Lwt.return (Some g)
      | None ->
          Lwt.return None
  in
  let%lwt _ = Db.add_device_to_group device group in
  `String "OK"
  |> respond')

let push_data_handler = (fun req ->
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
        let open Device in
        let%lwt () =
          Lwt_list.iter_s
            (fun payload ->
              let reading = Device.sensor_reading_of_payload payload in
              let now = CalendarLib.Calendar.now () in
              let sensor_type =
                Device.sclass_of_data_packet_payload payload
              in
              let%lwt _ =
                Db.add_data
                  now
                  (B64.decode packet.Device.device)
                  sensor_type
                  (payload
                    |> Device.data_packet_payload_to_yojson
                    |> Yojson.Safe.to_string)
              in
              Lwt.return ())
            packet.payload
        in
        `String "OK"
        |> respond'
    | Error msg ->
        raise (Failure ("MALFORMED JSON: " ^ msg));)

let static_controlpanel_handler =
  let read_file (prefix, path) =
    let fullpath = Filename.concat prefix path in
    let fd = Unix.openfile fullpath [Unix.O_CREAT] 0o440 in
    let ic = Lwt_io.(of_unix_fd ~mode:Input fd) in
    let%lwt body = Lwt_io.read ic in
    Lwt.return body
  in
  let read_file = Fuck_stdlib.lwt_memoize read_file 128 in
  (fun req ->
    let path =
      splat req
      |> List.rev
      |> List.fold_left
          (fun acc x ->
            let x =
              ExtString.String.replace_chars
                (function
                  | '/' -> ""
                  | c -> String.make 1 c)
                x
            in
            Filename.concat acc x)
          ""
    in
    let%lwt _ = Lwt_io.printf "Splat param: \"%s\"\n" path in
    let prefix = Filename.concat (Unix.getcwd ()) "../client/controlpanel" in
    let%lwt body = read_file (prefix, path) in
    `String body
    |> respond')

let middleware_auth =
  let filter handler req =
    let headers = Request.headers req in
    let _ = Lwt_io.printf "Auth middleware is running...\n" in
    let auth_token, username =
      match Cohttp.Header.get (Request.headers req) "Cookie" with
        | Some s ->
            let ls = Fuck_stdlib.get_post_params ~split_on:";" s in
            let username =
              List.find (fun (name, _) -> String.trim name = "username") ls
              |> snd
              |> Encrypt.hex_decode
            in
            let auth_token =
              List.find (fun (name, _) -> String.trim name = "auth_token") ls
              |> snd
              |> Encrypt.hex_decode
            in
            Some auth_token, Some username
        | None -> None, None
    in
    match auth_token, username with
      | None, None
      | Some _, None
      | None, Some _ ->
          respond'
            ~code:`Bad_request
            (`String "authentication failure (missing some or all required cookies)")
      | (Some auth_token'), (Some username') -> begin
          match Session.check username' auth_token' with
            | `Expired ->
                respond'
                  ~code:`Bad_request
                  (`String "authentication failure (expired)")
            | `Nope ->
                respond'
                  ~code:`Bad_request
                  (`String "authentication failure (invalid credentials)")
            | `Ok ->
                Printf.printf "Handling with normal handler\n";
                handler req
      end
  in
  Rock.Middleware.create ~filter ~name:"authorize users"

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
  let static_login =
    Middleware.static ~local_path:"../client/login" ~uri_prefix:"/a"
  in
  let auth_filter = Rock.Middleware.filter middleware_auth in
  let service_login = post "/login" login_handler in
  let service_push_data = post "/push-data" push_data_handler in
  let service_create_account = post "/create-account" create_account_handler in
  let service_create_group = post "/create-group" (auth_filter create_group_handler) in
  let service_associate_device = post "/associate-device" (auth_filter associate_device_handler) in
  let service_get_device_data = get "/get-data/:device" (auth_filter get_device_data_handler) in
  let service_get_user_devices = get "/get-devices/:username/:group" (auth_filter get_user_devices_handler) in
  let service_get_user_groups = get "/get-groups/:username" (auth_filter get_user_groups_handler) in
  let service_rename_group = get "/rename-group" (auth_filter rename_group_handler) in
  let service_delete_group = get "/delete-group" (auth_filter delete_group_handler) in
  let service_move_group = post "/change-group" (auth_filter move_group_handler) in
  let service_static_no_auth = middleware static_login in
  let service_static_auth1 = get "/s/*" (auth_filter static_controlpanel_handler) in
  let service_static_auth2 = get "/s/*/*" (auth_filter static_controlpanel_handler) in
  let service_static_auth3 = get "/s/*/*/*" (auth_filter static_controlpanel_handler) in
  let service_static_auth4 = get "/s/*/*/*/*" (auth_filter static_controlpanel_handler) in
  let service_static_auth5 = get "/s/*/*/*/*/*" (auth_filter static_controlpanel_handler) in
  let service_index = get "/index.html" (fun _ -> redirect' (Uri.of_string "/a/index.html")) in
  let service_root = get "/" (fun _ -> redirect' (Uri.of_string "/a/index.html")) in
  App.empty
  |> service_static_no_auth
  |> service_static_auth1
  |> service_static_auth2
  |> service_static_auth3
  |> service_static_auth4
  |> service_static_auth5
  |> service_create_account
  |> service_login
  |> service_create_group
  |> service_push_data
  |> service_associate_device
  |> service_get_user_devices
  |> service_get_user_groups
  |> service_get_device_data
  |> service_rename_group
  |> service_delete_group
  |> service_move_group
  |> service_index
  |> service_root
  |> App.run_command
