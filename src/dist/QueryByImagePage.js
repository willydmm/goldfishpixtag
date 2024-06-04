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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
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
exports.__esModule = true;
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var handleUpload = function (event, callback) { return __awaiter(void 0, void 0, void 0, function () {
    var fileInput, file, reader;
    var _a;
    return __generator(this, function (_b) {
        event.preventDefault();
        fileInput = document.getElementById('fileToUpload');
        if (!((_a = fileInput.files) === null || _a === void 0 ? void 0 : _a.length)) {
            alert('Please select a file to upload.');
            return [2 /*return*/];
        }
        file = fileInput.files[0];
        reader = new FileReader();
        reader.onload = function () {
            return __awaiter(this, void 0, void 0, function () {
                var base64Content, idToken, response, result, error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (typeof reader.result !== 'string') {
                                console.error('Error: FileReader result is not a string.');
                                alert('An error occurred while reading the file.');
                                return [2 /*return*/];
                            }
                            console.log('File read successfully.');
                            console.log('Sending request to API Gateway...');
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 4, , 5]);
                            base64Content = reader.result.split(',')[1];
                            idToken = sessionStorage.getItem('idToken');
                            return [4 /*yield*/, fetch('https://tw6nv3lpxl.execute-api.us-east-1.amazonaws.com/prod/query_by_image', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/octet-stream',
                                        'Authorization': "Bearer " + idToken
                                    },
                                    body: base64Content
                                })];
                        case 2:
                            response = _a.sent();
                            return [4 /*yield*/, response.json()];
                        case 3:
                            result = _a.sent();
                            console.log('Received response from API Gateway.', result);
                            callback && callback(result);
                            return [3 /*break*/, 5];
                        case 4:
                            error_1 = _a.sent();
                            console.error('Error:', error_1);
                            alert('An error occurred while uploading the image.');
                            return [3 /*break*/, 5];
                        case 5: return [2 /*return*/];
                    }
                });
            });
        };
        reader.onerror = function () {
            console.error('Error reading file:', reader.error);
            alert('Failed to read file.');
        };
        reader.readAsDataURL(file);
        return [2 /*return*/];
    });
}); };
var QueryByImagePage = function () {
    var navigate = react_router_dom_1.useNavigate();
    var _a = react_1.useState(null), imageFile = _a[0], setImageFile = _a[1];
    var _b = react_1.useState([]), imageResults = _b[0], setImageResults = _b[1];
    var _c = react_1.useState(false), copied = _c[0], setCopied = _c[1];
    var _d = react_1.useState(null), copiedIndex = _d[0], setCopiedIndex = _d[1];
    var handleImageChange = function (event) {
        setImageFile(event.target.files[0]);
    };
    var handleCopy = function (index) {
        setCopied(true);
        setCopiedIndex(index);
        setTimeout(function () {
            setCopied(false);
            setCopiedIndex(null);
        }, 2000);
    };
    var handleViewImage = function (thumbnailUrl) { return __awaiter(void 0, void 0, void 0, function () {
        var baseUrl, fullImageUrl;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // Parse thumbnail url to image url 
                    console.log(thumbnailUrl);
                    baseUrl = thumbnailUrl.replace("_thumbnail", "").replace("goldfishthumbnails", "goldfishimages");
                    console.log(baseUrl);
                    return [4 /*yield*/, getPresignedUrl(baseUrl)];
                case 1:
                    fullImageUrl = _a.sent();
                    // Navigate to new page to display image
                    navigate('/viewfullimage', { state: { imageUrl: fullImageUrl } });
                    return [2 /*return*/];
            }
        });
    }); };
    var getPresignedUrl = function (imageUrl) { return __awaiter(void 0, void 0, void 0, function () {
        var response, data, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetch("https://tw6nv3lpxl.execute-api.us-east-1.amazonaws.com/prod/presigned_url?url=" + imageUrl, {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        })];
                case 1:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error("HTTP error! Status: " + response.status + ", Status Text: " + response.statusText);
                    }
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    // console.log("Presigned URL:", data.presigned_url);
                    return [2 /*return*/, data.presigned_url];
                case 3:
                    error_2 = _a.sent();
                    console.error('Error fetching presigned URL:', error_2);
                    return [2 /*return*/, imageUrl];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    return (React.createElement("div", null,
        React.createElement("section", { className: "py-5 px-5 text-center container" },
            React.createElement("div", { className: "row py-lg-5" },
                React.createElement("div", { className: "col-lg-4 col-md-4 mx-auto" },
                    React.createElement("h2", null, "Search for Similar Images")),
                React.createElement("div", { className: 'spacer' }),
                React.createElement("form", { onSubmit: function (e) { return handleUpload(e, setImageResults); }, className: "mb-3 ml-5" },
                    React.createElement("div", { className: "input-group mb-3" },
                        React.createElement("input", { type: "file", accept: "image/*", name: "fileToUpload", id: "fileToUpload", className: "form-control" }),
                        React.createElement("button", { type: "submit", className: "btn btn-primary mt-2 mr-5" }, "Upload"))))),
        React.createElement("div", { className: "album py-3", style: { marginBottom: '100px' } },
            React.createElement("h3", null, "Matching Images"),
            React.createElement("div", { className: "row row-cols-1 row-cols-sm-2 row-cols-md-3 g-3 images" }, Array.isArray(imageResults) && imageResults.length > 0 ? (imageResults.map(function (image, index) { return (
            // <img src={image} width={400} key={index} />
            React.createElement("div", { key: index, className: "col image-card" },
                React.createElement("div", { className: "card shadow-sm" },
                    React.createElement("img", { src: image.presignedUrl, className: "bd-placeholder-img card-img-top", alt: "Thumbnail " + index, style: { objectFit: 'cover', height: '225px' } })),
                React.createElement("div", { className: "card-body" },
                    React.createElement("p", { className: "card-text" },
                        "Tags: ",
                        image.tags.length > 0 ? image.tags.join(', ') : 'No tag identified'),
                    React.createElement("div", { className: "d-flex justify-content-between align-items-center" },
                        React.createElement("div", { className: "btn-group" },
                            React.createElement("button", { type: "button", className: "btn btn-secondary", onClick: function () { return handleCopy(index); } }, "Copy URL"),
                            React.createElement("button", { type: "button", className: "btn btn-secondary", onClick: function () { return handleViewImage(image.thumbnailUrl); } }, "View Image")),
                        copied && copiedIndex === index && React.createElement("span", { style: { color: 'green' } }, "Copied!"))))); })) : (React.createElement("p", null, "No similar images found."))))));
};
exports["default"] = QueryByImagePage;
