module Accounts = struct
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
end

module Groups = struct
  type make_group_params =
    { user: string
    ; groupName: string
    }
    [@@deriving yojson]

  type make_group_req =
    { body: string
    }
    [@@deriving netblob
      { url = "http://localhost:8080/create-group"
      ; meth = `Post
      ; format = `Text
      }]

  let glist_of_yojson = [%of_yojson: Group.t list]

  type get_groups_req =
    { user: string [@path]
    }
    [@@deriving netblob
      { url = "http://localhost:8080/get-groups"
      ; meth = `Get
      ; format = `Json glist_of_yojson
      }]

  type delete_group_req =
    { body: string
    }
    [@@deriving netblob
      { url = "http://localhost:8080/delete-group"
      ; meth = `Post
      ; format = `Text
      }]
end

let get_http_result ?(expect = 200) code body =
  match code with
    | n when n = expect ->
        `Ok body
    | n ->
        `Failure(n, body)

let test_accounts () =
  let results = [] in
  let%lwt (code, body, cookies) =
    Accounts.netblob_post_make_account_req
      ~username:"someUser"
      ~password1:"somePassword"
      ~password2:"somePassword"
      ~email:"john.mcalpine@student.nmt.edu"
      ()
  in
  let results = ("Creating an account", get_http_result code body) :: results in
  let%lwt (code, body, cookies) =
    Accounts.netblob_post_make_account_req
      ~username:"someUser"
      ~password1:"somePassword"
      ~password2:"somePassword"
      ~email:"john.mcalpine@student.nmt.edu"
      ()
  in
  let results = ("Creating another account with the same username as an existing user", get_http_result ~expect:409 code body) :: results in
  let%lwt (code, body, cookies) =
    Accounts.netblob_post_make_account_req
      ~username:"someUser"
      ~password1:"somePassword"
      ~password2:"someOtherPassword"
      ~email:"john.mcalpine@student.nmt.edu"
      ()
  in
  let results = ("Creating an account where password1 != password2", get_http_result ~expect:409 code body) :: results in
  let%lwt (code, body, cookies) =
    Accounts.netblob_post_login_req
      ~username:"someUser"
      ~password:"somePassword"
      ()
  in
  let results = ("Logging into an account", get_http_result ~expect:302 code body) :: results in
  let (k, v) :: _ = cookies in
  Lwt.return (results, cookies)

let test_groups cookies =
  let results = [] in
  let _, user =
    List.find (fun (a, _) -> a = "username") cookies
  in
  let user = Encrypt.hex_decode user in
  let%lwt (code, body, _) =
    let body =
      Yojson.Safe.to_string (
        Groups.(
          make_group_params_to_yojson
            { user = user
            ; groupName = "someGroup1"
            }))
    in
    Groups.netblob_post_make_group_req
      ~body
      ~cookies
      ()
  in
  let results = ("Creating a group", get_http_result code body) :: results in
  let%lwt (code, body, _) =
    let body =
      Yojson.Safe.to_string (
        Groups.(
          make_group_params_to_yojson
            { user = user
            ; groupName = "someGroup1"
            }))
    in
    Groups.netblob_post_make_group_req
      ~body
      ~cookies
      ()
  in
  let results = ("Creating a group with the same name as an existing group", get_http_result ~expect:400 code body) :: results in
  let%lwt (code, body, _) =
    let body =
      Yojson.Safe.to_string (
        Groups.(
          make_group_params_to_yojson
            { user = user
            ; groupName = "someGroup2"
            }))
    in
    Groups.netblob_post_make_group_req
      ~body
      ~cookies
      ()
  in
  let results = ("Creating another group", get_http_result code body) :: results in
  let%lwt (code, groups, _) = Groups.netblob_get_get_groups_req ~user ~cookies () in
  let results = ("Getting groups", get_http_result code body) :: results in
  let result =
    match groups with
      | Ok groups ->
          if List.length groups = 2
          then `Ok ""
          else `Failure(-1, Printf.sprintf "There should be two groups in this list, but I can only see %d" (List.length groups))
      | Error msg ->
          `Failure(-1, Printf.sprintf "the server returned malformed JSON: %s" msg)
  in
  let results = ("Analyzing list of groups", result) :: results in
  let%lwt (code, body, _) = Groups.netblob_post_delete_group_req ~body:"someGroup1" ~cookies () in
  let%lwt (code, groups, _) = Groups.netblob_get_get_groups_req ~user ~cookies () in
  let results = ("Deleting a group", get_http_result code body) :: results in
  let results = ("Getting groups after deleting one of them", get_http_result code body) :: results in
  let result =
    match groups with
      | Ok groups ->
          if List.length groups = 1
          then `Ok ""
          else `Failure(-1, Printf.sprintf "Wrong number of groups in list: %d" (List.length groups))
      | Error msg ->
          `Failure(-1, Printf.sprintf "the server returned malformed JSON: %s" msg)
  in
  let results = ("Verifying that the deleted group is not there anymore", result) :: results in
  Lwt.return results

let () =
  let results, cookies =
    Lwt_main.run (test_accounts ())
  in
  let results' =
    Lwt_main.run (test_groups cookies)
  in
  let results = results @ results' in
  let overall_status =
    List.fold_left
      (fun status (test, result) ->
        match result with
          | `Ok body ->
              Printf.printf "%s... Success.\n";
              status
          | `Failure (code, body) ->
              Printf.printf "%s... Failed with code %d.\n%s\n" test code body;
              begin match status with
                | `Passed ->
                    `Failed [test]
                | `Failed tests ->
                    `Failed (test :: tests)
              end)
      `Passed
      results
  in
  match overall_status with
    | `Passed ->
        Printf.printf "Passed all of %d tests!\n" (List.length results);
        exit 0
    | `Failed tests ->
        Printf.printf "Failure, passed %d of %d tests.\n" (List.length results - List.length tests) (List.length results);
        List.iter (Printf.printf "\t failed \"%s\".\n") tests;
        exit(1)
