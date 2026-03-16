const { updateSiteSettings, getSiteSettings } = require('./utils/siteSettings');
(async () => {
  const updated = await updateSiteSettings({
    businessName: 'RoomRental',
    businessTagline: 'Find Your Perfect Roommate',
    supportAddress: 'Pune, Maharashtra'
  });
  console.log('UPDATED_OK', updated.businessName);
  const current = await getSiteSettings();
  console.log('READ_OK', current.businessName);
})();
