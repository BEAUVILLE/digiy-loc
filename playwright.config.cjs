'use strict';
module.exports={
  testDir:'./tests',
  testMatch:'**/loc-browser.staging.spec.cjs',
  timeout:15000,
  expect:{timeout:5000},
  retries:0,
  use:{browserName:'chromium',headless:true,viewport:{width:390,height:844}}
};
