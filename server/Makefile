oauth.native: oauth.ml
	ocamlbuild -use-ocamlfind -pkg opium.unix -pkg lwt -pkg unix -pkg yojson -pkg ppx_deriving_yojson oauth.native

test: oauth.native
	./oauth.native -p 80 -d

clean:
	ocamlbuild -clean
