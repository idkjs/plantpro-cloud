build: PlantPi_server.native

PlantPi_server.native: PlantPi_server.ml fuck_stdlib.ml device.ml user.ml db.ml session.ml email.ml
	ocamlbuild -tag thread -use-ocamlfind -pkgs calendar,extlib,opium.unix,lwt,unix,yojson,ppx_deriving_yojson,sqlexpr.ppx,cryptokit,lwt.ppx,netstring PlantPi_server.native

test: PlantPi_server.native
	./PlantPi_server.native -p 8080 -d & lt --port 8080 -s plantpi

install: build
	@echo "The PlantPi server doesn't really have a clean installation process at the moment"

clean:
	ocamlbuild -clean
