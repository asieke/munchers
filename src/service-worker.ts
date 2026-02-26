/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { build, files, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;

const CACHE = `cache-${version}`;

const ASSETS = [
	...build, // the app itself
	...files // everything in `static`
];

sw.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then((cache) => cache.addAll(ASSETS))
			.then(() => {
				sw.skipWaiting();
			})
	);
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then(async (keys) => {
			for (const key of keys) {
				if (key !== CACHE) await caches.delete(key);
			}
			sw.clients.claim();
		})
	);
});

sw.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') return;

	event.respondWith(
		(async () => {
			const url = new URL(event.request.url);

			// Try cache first for static assets
			const cachedResponse = await caches.match(event.request);
			if (cachedResponse) return cachedResponse;

			// Then try network
			try {
				const response = await fetch(event.request);
				// Cache successful responses
				if (response.status === 200) {
					const cache = await caches.open(CACHE);
					cache.put(event.request, response.clone());
				}
				return response;
			} catch {
				// If offline, return the cached index page for navigation requests
				if (event.request.mode === 'navigate') {
					const cachedIndex = await caches.match('/');
					if (cachedIndex) return cachedIndex;
				}
				return new Response('Offline', { status: 503 });
			}
		})()
	);
});
