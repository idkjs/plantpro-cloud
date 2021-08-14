FROM alpine:latest
RUN ping -c 4 8.8.8.8
RUN echo '@edge http://dl-4.alpinelinux.org/alpine/edge/main/' >> /etc/apk/repositories
RUN apk update \
  && apk add make m4 ocaml perl build-base gcc zlib-dev opam patch sqlite-dev glib-dev pkgconfig gmp-dev ncurses-dev camlp4 git bash nodejs-npm@edge \
  && npm install --save -g nightmare \
  && npm install --save nightmare \
  && npm install -g nightmare \
  && npm install --save -g mocha \
  && npm install --save mocha \
  && npm install -g mocha \
  && npm install --save -g chai \
  && npm install --save chai \
  && npm install -g chai \
  && export OPAMYES=true \
  && comp=${1:-system} \
  && opam init --comp="${comp}" \
  && opam switch 4.03.0 \
  && eval `opam config env` \
  && opam update \
  && opam install camlp4 ocamlnet uri cryptokit re ppx_deriving cohttp calendar
