import { json, redirect } from '@remix-run/node';
import { authenticate } from '../shopify.server';
import { Button, TextField, Card, Layout } from '@shopify/polaris';
import { useEffect, useState } from 'react';
import { useActionData, useLoaderData } from '@remix-run/react';
import { generateTenantCode, validateTenantCode } from '../services/signUpService.server';
import useSessionStorage from '../customHooks/useSessionStorage';
import { getLocationForShop } from '../services/apiClient.server';


export const loader = async ({ request }) => {


   const {session, admin} = await authenticate.admin(request);
   const locationResponse = await getLocationForShop(session.shop,session.accessToken);
   const phone = locationResponse.data.locations[0].phone;
   const response = await generateTenantCode(session.shop,phone);
   console.log(response)
   if(response.successful)
   {
       const tenantCode = response.data.tenantCode;
       console.log("tenantCode is" , tenantCode)
       return json({ tenantCode });
   }
   return json({tenantCode:""})
};

export const action = async ({ request }) => {
    const { session, admin, redirect } = await authenticate.admin(request);
    const formData = new URLSearchParams(await request.text());
    const tenantCode = formData.get('tenantCode');
 
    const tenantCreationParams = {
        address1: formData.get('address1'),
        address2: formData.get('address2'),
        city: formData.get('city'),
        pincode: formData.get('pincode'),
        state: formData.get('province'),
        country: formData.get('country'),
        locationId: formData.get('locationId'),
        tenantSetupStatus: "CHARGE_PENDING",
        shopDomain: session.shop
 
 
    };
    console.log("tenantCreationParams", tenantCreationParams);
 
 
    try {
       
        const response = await saveTenantCreationParams(session, tenantCreationParams,admin);
        console.log(response);
        if(response.successful) {
            return {successful:true,"confirmationUrl": response.data.confirmationUrl}
          }
        return redirect(applicationChargeResponse.appSubscriptionCreate.confirmationUrl)
    } catch (error) {
        return json({ error: 'Failed to initate tenantCreation' });
    }
 
 
 };
 

// export const action = async ({ request }) => {
//    const {session, admin,redirect} = await authenticate.admin(request);
//    const formData = new URLSearchParams(await request.text());
//    const tenantCode = formData.get('tenantCode');


//    const response = await validateTenantCode(session.shop,tenantCode);


//    if(response.successful = true) {
//        console.log("new generated tenantCode should be",response.tenantCode);
//        return redirect('/app/uniwareSignUpIII');
//    }
//    return json({ successful: false,"error":response.error });
// };


// export default function uniwareSignUpSignUpII() {
//    const loaderData = useLoaderData();
//    const [tenantCode, setTenantCode] = useSessionStorage('tenantCode', loaderData.tenantCode || '');
//    const actionData = useActionData();


//    useEffect(() => {
//        if (actionData?.tenantCode  ) {
//            setTenantCode(actionData.phone);
//        }
//    }, [actionData, setTenantCode]);


//    return (
//        <Layout>
//            <Layout.Section>
//                <Card title="Enter Tenant Code" sectioned>
//                    <form method="post">
//                        <div style={styles.inputContainer}>
//                        <TextField
//                            label="Tenant Code"
//                            value={tenantCode}
//                            onChange={(value) => setTenantCode(value)}
//                            type="text"
//                            name="tenantCode"
//                        />
//                        </div>
//                        <Button submit primary>Next</Button>
//                    </form>
//                    {actionData?.error && <p>{actionData.error}</p>}
//                </Card>
//            </Layout.Section>
//        </Layout>
//    );
// }

export default function uniwareSignUpSignUpII() {
    const loaderData = useLoaderData();
    const [tenantCode, setTenantCode] = useSessionStorage('tenantCode', loaderData.tenantCode || '');
   
    const actionData = useActionData();
    
    const navigate = useNavigate();
    const linkRef = useRef(null);
  
    const shopify = useAppBridge();
    const redirect = Redirect.create(shopify);
    
    const handleSubmit = (event) => {
      event.preventDefault();
      event.target.submit();
    };

    useEffect(() => {
        if (actionData?.tenantCode  ) {
            setTenantCode(actionData.phone);
        }
    }, [actionData, setTenantCode]);
 
    return (
      <div style={styles.container}>
        <div style={styles.leftSection}>
          <div style={styles.textBelowLogo}>
            <span style={styles.line1}>E-commerce selling</span>
            <br />
            <span style={styles.line2}>SIMPLIFIED</span>
            <br />
            <span style={styles.line3}>across the globe</span>
          </div>
  
          <p style={styles.trustedText}>Trusted by 3600+ Brands</p>
          <div style={styles.brandLogos}>
            <img src="/path-to-tcns-logo.png" alt="TCNS" style={styles.logo} />
            <img src="/path-to-lenskart-logo.png" alt="Lenskart" style={styles.logo} />
            <img src="/path-to-best-seller-logo.png" alt="Bestseller" style={styles.logo} />
            <img src="/path-to-mamaearth-logo.png" alt="Mamaearth" style={styles.logo} />
            <img src="/path-to-boat-logo.png" alt="Boat" style={styles.logo} />
          </div>
        </div>
  
        {/* Right Section */}
        <div style={styles.rightSection}>
          <div style={styles.header}>
            <img src="/images/logo.svg" alt="Unicommerce Logo" style={{ width: "120px" }} />
            <h2 style={styles.h2}>Welcome to Unicommerce</h2>
            <p style={styles.instruction}>Sign Up below to create a new account.</p>
          </div>
  
          <Form method="post" style={styles.formContainer}>
            <TextField
              label={<span style={styles.customLabel}>Tenant Code</span>}
              value={tenantCode}
              onChange={(value) => setTenantCode(value)}
              placeholder="Enter your Tenant"
              type="tenantCode"
              name="tenantCode"
            />
            <Button submit primary>Submit</Button>
          </Form>
  
        </div>
      </div>
    );
  }

const styles = {
    container: {
      display: "flex",
      height: "100vh",
      backgroundImage: `
        linear-gradient(
          to bottom right,
          #1F87C2 0%,
          #1F87C2CC 30%,
          #ACC90D80 70%,
          #ACC90D 100%
        ),
        url('/images/warehouse.jpg')
      `,
      backgroundSize: "cover",
      backgroundPosition: "center",
      justifyContent: "space-between",
      alignItems: "flex-start",
      color: "#000",
      padding: "1rem",
    },
    leftSection: {
      width: "50%",
      maxWidth: "600px",
      color: "#fff",
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      justifyContent: "flex-start",
      marginTop: "1rem",
      marginLeft: "3rem",
    },
    textBelowLogo: {
      height: "168px",
      width: "80%",
      fontWeight: "500",
      lineHeight: "3rem",
      fontSize: "3rem",
      marginTop: "2rem",
    },
    trustedText: {
      fontSize: "1.5rem",
      fontWeight: 500,
      marginTop: "1rem",
    },
    brandLogos: {
      display: "flex",
      gap: "1rem",
      justifyContent: "flex-start",
      flexWrap: "wrap",
      marginTop: "1rem",
    },
    logo: {
      height: "40px",
    },
    rightSection: {
      width: "40%",
      height: "100%",
      backgroundColor: "#fff",
      borderRadius: "10px",
      padding: "2rem",
      boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
    },
    header: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      gap: "0.5rem",
      marginBottom: "2rem",
    },
    h2: {
      fontWeight: 600,
    },
    instruction: {
      color: "#757575",
    },
    customLabel: {
      color: "#757575",
      fontWeight: "700",
    },
    formContainer: {
      display: "flex",
      flexDirection: "column",
      gap: "1rem",
    },
    socialLinks: {
      display: "flex",
      justifyContent: "center",
      marginTop: "2rem",
      gap: "1rem",
    },
    socialIcon: {
      width: "30px",
      height: "30px",
    },
  };
  