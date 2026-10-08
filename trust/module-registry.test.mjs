import test from "node:test";
import assert from "node:assert/strict";
import {MODULES,moduleCriteria,moduleAttestationEnabled} from "./module-registry.mjs";
test("every declared module has a criterion set",()=>{for(const m of Object.keys(MODULES)) assert.ok(moduleCriteria(m).includes("quality"));});
test("unknown or prototype names are rejected",()=>{for(const m of ["unknown","__proto__","constructor","toString",""]) assert.equal(moduleCriteria(m),null);});
test("all module attestations fail closed until audited",()=>{for(const m of [...Object.keys(MODULES),"unknown"]) assert.equal(moduleAttestationEnabled(m),false);});
test("existing specialist criteria remain available",()=>{assert.ok(moduleCriteria("loc").includes("comfort"));assert.ok(moduleCriteria("resto").includes("food_quality"));assert.ok(moduleCriteria("driver").includes("driving_safety"));});
