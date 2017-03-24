open ExtString

let get_post_params body =
  let lines = String.nsplit body "&" in
  List.map
    (fun line ->
      String.split line "=")
    lines
