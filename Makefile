client:
	cd client && npm run build && npm run webpack

test: client
	cd server && make test &

clean:
	rm client/controlpanel/lib/* client/controlpanel/dist/*
