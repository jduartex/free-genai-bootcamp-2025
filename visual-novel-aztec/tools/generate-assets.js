"use strict";
// @ts-check
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var AIAssetGenerator_js_1 = require("../src/utils/AIAssetGenerator.js");
var node_voice_generator_js_1 = require("./node-voice-generator.js");
var fs = require("fs");
var path = require("path");
var url_1 = require("url");
// Use dynamic import for fileURLToPath
var __filename;
var __dirname;
try {
    // For ESM environments
    __filename = (0, url_1.fileURLToPath)(import.meta.url);
    __dirname = path.dirname(__filename);
}
catch (e) {
    // Fallback for CommonJS or environments without import.meta
    __filename = ''; // Remove self-reference
    __dirname = process.cwd(); // Remove self-reference
}
// Character definitions for generation
var characterPrompts = {
    'tlaloc': 'Male Aztec warrior in his 30s with strong muscular build, weathered face with determined expression, traditional attire, hyperrealistic photography',
    'citlali': 'Female Aztec healer in her early 30s with long black hair tied back, calm expression, simple clothing with symbolic patterns, hyperrealistic photography',
    'diego': 'Spanish conquistador guard in his 40s, stern expression, armor and helmet, hyperrealistic photography'
};
// Scene definitions
var scenePrompts = {
    'prison-cell': '16th century Spanish colonial prison cell, dark stone walls, small barred window, wooden bed, dimly lit, realistic',
    'aztec-village': 'Vibrant Aztec village with traditional structures, decorative art, people in traditional clothing, daytime, sunny',
    'spanish-invasion': 'Chaotic scene of Spanish conquistadors invading Aztec territory, soldiers with weapons, battle, smoke, dramatic lighting',
    'hidden-tunnel': 'Narrow earthen escape tunnel, dim lighting, rough-hewn passage, wooden supports, claustrophobic'
};
function generateAllAssets() {
    return __awaiter(this, void 0, void 0, function () {
        var backgroundPromises, characterPromises, error_1;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    console.log('Starting asset generation...');
                    // Create necessary directories
                    ensureDirectories();
                    // Generate scene backgrounds
                    console.log('Generating scene backgrounds...');
                    backgroundPromises = Object.entries(scenePrompts).map(function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
                        var error_2;
                        var scene = _b[0], prompt = _b[1];
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    console.log("Generating scene: ".concat(scene));
                                    _c.label = 1;
                                case 1:
                                    _c.trys.push([1, 3, , 4]);
                                    return [4 /*yield*/, AIAssetGenerator_js_1.AIAssetGenerator.generateBackground(scene, prompt)];
                                case 2:
                                    _c.sent();
                                    console.log("\u2713 Scene ".concat(scene, " generated"));
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_2 = _c.sent();
                                    console.error("\u2717 Failed to generate scene ".concat(scene, ":"), error_2);
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Generate character portraits
                    console.log('Generating character portraits...');
                    characterPromises = Object.entries(characterPrompts).map(function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
                        var error_3;
                        var character = _b[0], prompt = _b[1];
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    console.log("Generating character: ".concat(character));
                                    _c.label = 1;
                                case 1:
                                    _c.trys.push([1, 3, , 4]);
                                    return [4 /*yield*/, AIAssetGenerator_js_1.AIAssetGenerator.generateCharacter(character, prompt)];
                                case 2:
                                    _c.sent();
                                    console.log("\u2713 Character ".concat(character, " generated"));
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_3 = _c.sent();
                                    console.error("\u2717 Failed to generate character ".concat(character, ":"), error_3);
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Wait for all image generation to complete
                    return [4 /*yield*/, Promise.allSettled(__spreadArray(__spreadArray([], backgroundPromises, true), characterPromises, true))];
                case 1:
                    // Wait for all image generation to complete
                    _a.sent();
                    // Voice generation would go here if AWS credentials are set up
                    // Initialize the NodeVoiceGenerator
                    console.log('Initializing NodeVoiceGenerator for voice generation...');
                    node_voice_generator_js_1.NodeVoiceGenerator.initialize();
                    console.log('Asset generation complete!');
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    console.error('Asset generation failed:', error_1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function ensureDirectories() {
    var publicDir = path.resolve(process.cwd(), 'public');
    fs.mkdirSync(publicDir, { recursive: true });
    var assetsDir = path.resolve(publicDir, 'assets');
    fs.mkdirSync(assetsDir, { recursive: true });
    fs.mkdirSync(path.resolve(assetsDir, 'scenes'), { recursive: true });
    fs.mkdirSync(path.resolve(assetsDir, 'characters'), { recursive: true });
    fs.mkdirSync(path.resolve(assetsDir, 'audio'), { recursive: true });
    fs.mkdirSync(path.resolve(assetsDir, 'audio/dialogue'), { recursive: true });
    fs.mkdirSync(path.resolve(assetsDir, 'ui'), { recursive: true });
}
// Run the asset generation
generateAllAssets();
