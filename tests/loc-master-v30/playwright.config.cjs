'use strict';
module.exports={
  testDir:'.',
  testMatch:'**/owner-browser.spec.cjs',
  timeout:20000,
  expect:{timeout:7000},
  retries:0,
  use:{browserName:'chromium',headless:true,viewport:{width:390,height:844}}
};
