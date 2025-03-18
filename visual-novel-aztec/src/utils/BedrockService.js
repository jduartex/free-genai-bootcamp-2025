"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BedrockService = void 0;
var client_bedrock_runtime_1 = require("@aws-sdk/client-bedrock-runtime");
/**
 * Service for interacting with AWS Bedrock AI services
 * Handles image generation and text operations
 */
var BedrockService = /** @class */ (function () {
    function BedrockService() {
        this.client = new client_bedrock_runtime_1.BedrockRuntimeClient({
            region: process.env.AWS_REGION || 'us-east-1'
        });
        this.preferredModel = process.env.BEDROCK_PREFERRED_MODEL || 'stability.stable-diffusion-xl-v1';
    }
    /**
     * Get the singleton instance of BedrockService
     */
    BedrockService.getInstance = function () {
        if (!BedrockService.instance) {
            BedrockService.instance = new BedrockService();
        }
        return BedrockService.instance;
    };
    /**
     * Generate an image based on text prompt
     */
    BedrockService.prototype.generateImage = function (prompt_1) {
        return __awaiter(this, arguments, void 0, function (prompt, negativePrompt, width, height) {
            var requestData, error_1;
            if (negativePrompt === void 0) { negativePrompt = ''; }
            if (width === void 0) { width = 512; }
            if (height === void 0) { height = 512; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        requestData = this.buildImageRequest(prompt, negativePrompt, width, height);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.invokeModel(this.preferredModel, requestData)];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        error_1 = _a.sent();
                        console.error('Error generating image:', error_1);
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Build the appropriate request format based on the model
     */
    BedrockService.prototype.buildImageRequest = function (prompt, negativePrompt, width, height) {
        var model = this.preferredModel;
        if (model.startsWith("stability.")) {
            return {
                text_prompts: [
                    { text: prompt, weight: 1.0 },
                    { text: negativePrompt, weight: -1.0 }
                ],
                cfg_scale: 7,
                steps: 30,
                seed: Math.floor(Math.random() * 1000000),
                width: width,
                height: height
            };
        }
        else if (model.startsWith("amazon.titan")) {
            return {
                textPrompt: prompt,
                negativePrompt: negativePrompt,
                width: width,
                height: height,
                quality: "standard",
                cfgScale: 7,
                seed: Math.floor(Math.random() * 1000000)
            };
        }
        else {
            return {
                text_prompts: [
                    { text: prompt, weight: 1.0 },
                    { text: negativePrompt, weight: -1.0 }
                ],
                cfg_scale: 7,
                steps: 30,
                seed: Math.floor(Math.random() * 1000000),
                width: width,
                height: height
            };
        }
    };
    /**
     * Invoke the Bedrock model with the given data
     */
    BedrockService.prototype.invokeModel = function (modelId, requestData) {
        return __awaiter(this, void 0, void 0, function () {
            var command, response, responseBody;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        command = new client_bedrock_runtime_1.InvokeModelCommand({
                            modelId: modelId,
                            body: JSON.stringify(requestData),
                            contentType: "application/json",
                            accept: "application/json"
                        });
                        return [4 /*yield*/, this.client.send(command)];
                    case 1:
                        response = _a.sent();
                        responseBody = JSON.parse(new TextDecoder().decode(response.body));
                        // Handle different response formats from different models
                        if (responseBody.artifacts && responseBody.artifacts.length > 0) {
                            return [2 /*return*/, responseBody.artifacts[0].base64];
                        }
                        else if (responseBody.images && responseBody.images.length > 0) {
                            return [2 /*return*/, responseBody.images[0].base64];
                        }
                        else if (responseBody.image) {
                            return [2 /*return*/, responseBody.image];
                        }
                        else {
                            throw new Error("Unexpected response format: " + JSON.stringify(responseBody));
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    return BedrockService;
}());
exports.BedrockService = BedrockService;
