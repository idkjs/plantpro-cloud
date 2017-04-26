open ExtString

let get_post_params ?(split_on="&") body =
  let lines = String.nsplit body split_on in
  List.map
    (fun line ->
      let a, b = String.split line "=" in
      Netencoding.Url.(decode a, decode b))
    lines
