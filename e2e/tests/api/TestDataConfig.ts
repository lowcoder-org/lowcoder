class TestConfigData 
{
    static PortalHost = process.env.PORTAL_HOST ? process.env.PORTAL_HOST : 'https://prod-us1.openflower.org/'; // 'http://localhost:/'
}

export default TestConfigData;