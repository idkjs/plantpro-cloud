type make_account_req =
  { username: string [@post]
  ; password1: string [@post]
  ; password2: string [@post]
  ; email: string [@post]
  }
  [@@deriving netblob
    { url = "http://localhost:8080/create-account"
    ; meth = `Post
    ; format = `Text
    }]

type login_req =
  { username: string [@post]
  ; password: string [@post]
  }
  [@@deriving netblob
    { url = "http://localhost:8080/login"
    ; meth = `Post
    ; format = `Text
    }]

let test_account () =
  let%lwt (code, body, cookies) =
    netblob_post_make_account_req
      ~username:"someUser"
      ~password1:"somePassword"
      ~password2:"somePassword"
      ~email:"john.mcalpine@student.nmt.edu"
      ()
  in
  let%lwt () = Lwt_io.printf "Body: %s\n" body in
  let%lwt (code, body, cookies) =
    netblob_post_login_req
      ~username:"someUser"
      ~password:"somePassword"
      ()
  in
  let [k, v] :: _ = cookies in
  let%lwt () = Lwt_io.printf "Body: %s\n" body in
  Lwt.return ()

let () =
  Lwt_main.run (test_account ())

