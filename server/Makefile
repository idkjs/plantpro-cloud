oauth.native: oauth.ml fuck_stdlib.ml
	ocamlbuild -use-ocamlfind -pkgs extlib,opium.unix,lwt,unix,yojson,ppx_deriving_yojson oauth.native

test: oauth.native
	./oauth.native -p 8080 -d

clean:
	ocamlbuild -clean
