oauth.native: oauth.ml fuck_stdlib.ml device.ml user.ml db.ml session.ml
	ocamlbuild -tag thread -use-ocamlfind -pkgs calendar,extlib,opium.unix,lwt,unix,yojson,ppx_deriving_yojson,sqlexpr.ppx,cryptokit,lwt.ppx oauth.native

test: oauth.native
	./oauth.native -p 8080 -d & lt --port 8080 -s plantpi

clean:
	ocamlbuild -clean
