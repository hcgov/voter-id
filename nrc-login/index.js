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
var _this = this;
function validateEmail(input) {
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(input);
}
document.addEventListener('DOMContentLoaded', function () {
    var emailInput = document.getElementById('email');
    var emailError = document.getElementById('email-error');
    var otpSendBtn = document.getElementById('send-code');
    var otpSection = document.getElementById('otp');
    var otpInput = document.getElementById('otp-input');
    var submitBtn = document.getElementById('submit');
    emailInput.addEventListener('input', function () {
        if (!validateEmail(emailInput.value) && emailInput.value) {
            emailError.innerHTML = "Please enter a valid email address<br><br>";
            otpSendBtn.disabled = true;
            console.log("A");
        }
        else if (emailInput.value) {
            otpSendBtn.disabled = false;
            emailError.innerHTML = "";
            console.log("B");
        }
        else {
            emailError.innerHTML = "";
            otpSendBtn.disabled = true;
            console.log("C");
        }
    });
    otpSendBtn.addEventListener("click", function () { return __awaiter(_this, void 0, void 0, function () {
        var email, response, data, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    otpSendBtn.disabled = true;
                    otpSendBtn.innerHTML = "Sending...";
                    email = emailInput.value.trim().toLowerCase();
                    if (!validateEmail(email)) {
                        alert("Please enter a valid email address.");
                        otpSendBtn.disabled = false;
                        return [2 /*return*/];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, fetch("https://voterid.astr.ac/nrc-email-check", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                email: email
                            })
                        })];
                case 2:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 3:
                    data = _a.sent();
                    if (!data.ok) {
                        alert(data.error || "Unable to send verification code");
                        otpSendBtn.disabled = true;
                        return [2 /*return*/];
                    }
                    otpSection.style.display = "block";
                    otpSendBtn.style.display = "none";
                    return [3 /*break*/, 5];
                case 4:
                    err_1 = _a.sent();
                    console.log(err_1);
                    alert("Unable to verify email address\n".concat(err_1));
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); });
    submitBtn.addEventListener("click", function () { return __awaiter(_this, void 0, void 0, function () {
        var email, code, form, emailField, codeField;
        return __generator(this, function (_a) {
            email = emailInput.value.trim().toLowerCase();
            code = otpInput.value.trim();
            if (!/^\d{6}$/.test(code)) {
                alert("Please enter a 6-digit OTP code");
                return [2 /*return*/];
            }
            form = document.createElement("form");
            form.method = "POST";
            form.action = "https://voterid.astr.ac/verify-otp";
            emailField = document.createElement("input");
            emailField.type = "hidden";
            emailField.name = "email";
            emailField.value = email;
            codeField = document.createElement("input");
            codeField.type = "hidden";
            codeField.name = "code";
            codeField.value = code;
            form.appendChild(emailField);
            form.appendChild(codeField);
            document.body.appendChild(form);
            form.submit();
            return [2 /*return*/];
        });
    }); });
});
