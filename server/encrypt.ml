open Cryptokit

let rng = Random.device_rng "/dev/urandom";;

let hex_encode str =
  transform_string (Hexa.encode ()) str;;

let hex_decode str =
  transform_string (Hexa.decode ()) str;;

(*output 32 bytes*)
let hash msg =
  let h_method = Hash.sha256 () in
  hash_string h_method msg;;

(*self explanatory*)
let wipe_str str =
  wipe_string str;;

module Diffie_hellman = struct
  (*val parameters: DH.parameters*)
  let parameters = DH.new_parameters ~rng:rng 1024;;

  (*() -> DH.private_secret*)
  let gen_priv_secret () =
    DH.private_secret ~rng:rng param;;

  (*DH.private_secret -> string*)
  let gen_message priv_sec =
    DH.message param priv_sec;;

  (*Need I say msg should not be the one you generated*)
  (*DH.private_secret -> string -> string*)
  let shared_secret priv_sec msg =
    DH.shared_secret param priv_sec msg;;

  (** derives a secret string
      (typically, a key for symmetric encryption) from the given shared
      secret.  [numbytes] is the desired length for the returned string.*)
  (*string -> int -> string*)
  let derive_key shared_sec num_bytes =
    DH.derive_key shared_sec num_bytes;;
end

module Asymm_enc = struct
  (*() -> RSA.key*)
  let rsa_key_gen () =
    RSA.new_key ~rng:rng 1024;;

  (*RSA.key -> string -> string*)
  let rsa_sign key msg =
    RSA.sign key msg;;

  (*RSA.key ->string ->string*)
  let rsa_unsign key msg =
    RSA.unwrap_signature key msg;; 

  (*RSA.key -> string -> string*)
  let rsa_encrypt key msg =
    RSA.encrypt key msg;;

  (*RSA.key -> string -> string*)
  let rsa_decrypt key ctext =
    RSA.decrypt key ctext;;
end

(*The only functions you should be using are enc() and dec()*)
module Symm_enc = struct
  let enc_cipher key =
    let enc = new Block.aes_encrypt key in
    new Block.cipher_padded_encrypt Padding._8000 enc;;

  let dec_cipher key =
    let dec = new Block.aes_decrypt key in
    new Block.cipher_padded_decrypt Padding._8000 dec;;

  let encrypt_msg cipher msg =
    transform_string cipher msg

  let decrypt_msg = encrypt_msg;;

(*enc: str -> str -> str*)
  let enc msg key =
    let cipher = enc_cipher key in
    encrypt_msg cipher msg;;

(*dec: str -> str -> str*)
  let dec msg key =
    let cipher = dec_cipher key in
    decrypt_msg cipher msg;;
end
