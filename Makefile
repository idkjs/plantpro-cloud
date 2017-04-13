client: client/index.html client/controlpanel/dashboard.html client/controlpanel/js/dashboard.js
	cd client && npm run build && npm run webpack

test: client
	cd server && make test &

clean:
	rm client/controlpanel/lib/* client/controlpanel/dist/*
