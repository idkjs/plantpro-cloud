open CalendarLib

let () =
  Random.self_init()

type t =
  { creation_time: Calendar.t
  ; name: string
  ; email: string
  ; salt: string
  ; p_hash: string
  }

let create name email password =
  let salt = string_of_int (Random.bits()) in
  { creation_time = Calendar.now()
  ; name = name
  ; email = email
  ; salt = salt
  ; p_hash =
      Cryptokit.hash_string
        (Cryptokit.Hash.sha512())
        (name ^ email ^ salt ^ password)
  }

let check name password user =
  let p_hash =
    Cryptokit.hash_string
      (Cryptokit.Hash.sha512())
      (name ^ user.email ^ user.salt ^ password)
  in
  if p_hash = user.p_hash
  then `Ok
  else `Nope
