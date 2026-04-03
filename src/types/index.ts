/**
 * Shared type definitions for the Hailstone wreck-diving map app.
 *
 * These interfaces are derived from the existing JavaScript codebase:
 * - WreckLocation / WreckFeature: from src/assets/wreckLocations.json
 * - FirebaseConfig: from src/scripts/firebase/_client.js
 * - UserData: from src/scripts/firebase/_userManager.js + _firestoreQueries.js
 * - ImageRecord / GalleryItem: from src/scripts/firebase/_firestoreQueries.js
 * - MapConfig: from src/scripts/mapbox/_formatMap.js + _loadMap.js
 * - AppContext: typed replacement for window.* globals
 */

// ---------------------------------------------------------------------------
// GeoJSON / Wreck Data
// ---------------------------------------------------------------------------

export interface WreckProperties {
	id: string;
	title: string;
	averageDepth: string;
	maxDepth: string;
	isMapLabel: boolean;
	isGreatestHit: boolean;
	length: number;
	vesselType: string;
	cargo?: string;
}

export interface WreckGeometry {
	type: "Point";
	coordinates: [longitude: number, latitude: number];
}

export interface WreckFeature {
	type: "Feature";
	properties: WreckProperties;
	geometry: WreckGeometry;
}

export interface WreckFeatureCollection {
	type: "FeatureCollection";
	features: WreckFeature[];
}

// ---------------------------------------------------------------------------
// Firebase
// ---------------------------------------------------------------------------

export interface FirebaseConfig {
	apiKey: string;
	authDomain: string;
	projectId: string;
	storageBucket: string;
	messagingSenderId: string;
	appId: string;
	measurementId?: string;
}

export interface UserData {
	uid: string;
	providerId: string;
	email?: string;
	displayName?: string;
	givenName?: string;
	familyName?: string;
	pictureURL?: string;
	appHostedPictureURL?: string;
	username?: string;
	uploadRecords?: UploadRecord[];
	upvotedImages?: string[];
}

export interface UploadRecord {
	wreckId: string;
	imgId: string;
}

export interface ImageRecord {
	storagePath: string;
	wreckId: string;
	uploadedBy: string;
	timeCreated: string;
	imageCaption?: string;
	cameraDetails?: string;
	diveOperators?: string;
	upvotes: number;
}

export interface GalleryItem {
	imgId: string;
	url: string;
	upvotes: number;
}

// ---------------------------------------------------------------------------
// Mapbox
// ---------------------------------------------------------------------------

export interface MapCameraConfig {
	center: [number, number];
	zoom: number;
	bearing: number;
	pitch?: number;
}

export interface MapConfig {
	maxZoom: number;
	minZoom: number;
	maxBounds: [[number, number], [number, number]];
	style: string;
	center: [number, number];
	zoom: number;
	bearing: number;
	pitch: number;
}

export interface MapCanvasAPI {
	flyCamera: (target: WreckFeature) => void;
}

// ---------------------------------------------------------------------------
// Firebase Client API (exposed via window.firebaseClient today)
// ---------------------------------------------------------------------------

export interface FirebaseClientAPI {
	loginUI: { start: () => void };
	createUserRecord: (config: Partial<UserData>) => Promise<void>;
	queryUserRecord: (uid: string) => Promise<void>;
	updateUserRecord: (args: { uid: string; userData: Partial<UserData> }) => Promise<void>;
	getProfileImage: (args: { storagePath: string }) => Promise<string>;
	uploadProfileImage: (args: { storagePath: string; userFile: File }) => Promise<void>;
	signOut: () => Promise<void>;
	loadImagesFromDB: (args: {
		gallery: string;
		domCallback: (item: GalleryItem) => void;
		filterIDs?: string[] | null;
	}) => Promise<void>;
	uploader: (args: {
		storageRecord: { storagePath: string; userFile: File };
		dbRecord: {
			dbCollection: string;
			dbFields: Partial<ImageRecord>;
			arrayUnion?: (id: string) => unknown;
		};
		progressBar: HTMLProgressElement;
		onComplete: (item: GalleryItem) => void;
	}) => void;
	upvoteImage: (args: { gallery: string; id: string; uid: string }) => void;
}

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------

export interface ModalInstance {
	modal: HTMLElement;
	remove: () => void;
	replace?: (content: HTMLElement) => void;
}

// ---------------------------------------------------------------------------
// App Context (typed replacement for window.* globals)
// ---------------------------------------------------------------------------

export interface AppContext {
	firebaseClient: FirebaseClientAPI | null;
	user: { uid: string; isAnonymous: boolean } | null;
	userData: UserData | null;
	activeModal: ModalInstance | null;
	mapCanvas: MapCanvasAPI | null;
	wreckFeatures: WreckFeature[];
	updateUserStatusBar: (() => void) | null;
	launchAuthUI: (() => void) | null;
	hideAuthUI: (() => void) | null;
}
