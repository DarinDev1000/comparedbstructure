var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
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
var _ = require('underscore');
var DBCompare = /** @class */ (function () {
    function DBCompare() {
    }
    DBCompare.home = function (ctx) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, ctx.render('index.twig', { message: ctx.params.info })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    DBCompare.compareDatabasesStart = function (ctx) {
        return __awaiter(this, void 0, void 0, function () {
            var databaseName1, db1Tables, databaseName2, db2Tables, index, index, i, row1, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 7, , 8]);
                        databaseName1 = process.env.DB_COMPARE_1_DATABASE;
                        return [4 /*yield*/, global.comparedb1.query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES \n                                                WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_SCHEMA=:databaseName1 ;", { databaseName1: databaseName1 })];
                    case 1:
                        db1Tables = (_a.sent())[0];
                        databaseName2 = process.env.DB_COMPARE_2_DATABASE;
                        return [4 /*yield*/, global.comparedb2.query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES \n                                                WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_SCHEMA=:databaseName2 ;", { databaseName2: databaseName2 })];
                    case 2:
                        db2Tables = (_a.sent())[0];
                        console.log(db1Tables);
                        console.log(db2Tables);
                        console.log(typeof db1Tables);
                        console.log(typeof db2Tables);
                        // Converts object to string to compare equality.
                        // --------- THIS DOES NOT WORK CORRECTLY -------- only counts number of tables
                        for (index = 0; index < db1Tables.length; index++) {
                            console.log(db1Tables[index]);
                            console.log(db2Tables[index]);
                            if (String(db1Tables[index]) === String(db2Tables[index])) {
                                console.log("same");
                            }
                            else
                                console.log("different");
                        }
                        // Object evaluation does not work intuitively like other expressions.
                        // Uses underscore library to compare objects
                        // Alternative version to converting to string
                        console.log(_.isEqual(db1Tables, db2Tables));
                        if (!_.isEqual(db1Tables, db2Tables)) return [3 /*break*/, 4];
                        console.log("Tables are same");
                        return [4 /*yield*/, ctx.render('dbcompare.twig', { tableSame: true, color: 'green', result1: db1Tables, result2: db2Tables, tablesSameResult: "Yes, The databases have the same tables." })];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 4:
                        console.log("Tables are NOT the same");
                        return [4 /*yield*/, ctx.render('dbcompare.twig', { tableSame: false, color: 'red', result1: db1Tables, result2: db2Tables, tablesSameResult: "NO, The databases have different tables." })];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6:
                        //-----------------------------------------------------
                        // Compare columns in tables
                        //-----------------------------------------------------
                        // Converts object to string to compare equality.
                        for (index = 0; index < db1Tables.length; index++) {
                            console.log(db1Tables[index]);
                            console.log(db2Tables[index]);
                            if (String(db1Tables[index]) === String(db2Tables[index])) {
                                console.log("same");
                            }
                            else
                                console.log("different");
                            i = 0;
                        }
                        console.log(typeof db1Tables[0]);
                        row1 = db1Tables[0];
                        console.log(row1.TABLE_NAME);
                        return [3 /*break*/, 8];
                    case 7:
                        e_1 = _a.sent();
                        console.log(e_1);
                        throw e_1;
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    return DBCompare;
}());
module.exports = DBCompare;
