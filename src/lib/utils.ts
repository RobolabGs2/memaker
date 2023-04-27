export function useBlobUrl<T>(blob: Blob, action: (url: string) => Promise<T>): Promise<T> {
	const url = URL.createObjectURL(blob);
	return action(url).finally(() => URL.revokeObjectURL(url));
}

export function downloadImage(url: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = 'anonymous';
		img.onload = function () {
			return resolve(img);
		};
		img.onerror = function () {
			return reject(new Error(`Can't load image ${url}`));
		};
		img.src = url;
	});
}

export function saveBlob(filename: string) {
	return (blob: Blob) => {
		const a = document.createElement('a');
		a.download = filename;
		a.href = URL.createObjectURL(blob);
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(a.href);
	};
}
