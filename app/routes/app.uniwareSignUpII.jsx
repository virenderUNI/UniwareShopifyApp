import React, { useRef } from "react";
import { Button, TextField, Card, Layout } from "@shopify/polaris";
import { Form, useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { getShopifyPlanDetails } from "../services/apiClient.server";
import { getLocationForShop } from '../services/apiClient.server';
import { generateTenantCode } from '../services/signUpService.server';
import useSessionStorage from '../customHooks/useSessionStorage';
import { validateTenantCode } from '../services/signUpService.server';
import { saveTenantCreationParams } from "../services/signUpService.server";
import { setConfirmationUrl } from "../services/signUpService.server";

export const loader = async ({ request }) => {
  // console.log("loader request is from signup2 :" , request);
  const { session, admin, redirect } = await authenticate.admin(request);
  const locationResponse = await getLocationForShop(session.shop, session.accessToken);
  const phone = locationResponse.data.locations[0].phone;
  const response = await generateTenantCode(session.shop, phone);

  console.log(response);
  if (response.successful) {
    const tenantCode = response.data.tenantCode;
    console.log("tenantCode from loader", tenantCode)
    return { "tenantCode": tenantCode };
  }

  const shopPlanDetails = await getShopifyPlanDetails(admin);
  console.log("shop plan details : ", shopPlanDetails);
  if (shopPlanDetails.data.shop.plan.shopifyPlus) {
    throw redirect("/app/denyLogin");
  }
  return { "shopDetails": JSON.stringify(shopPlanDetails.data) };
};

export const action = async ({ request }) => {
  const formData = new URLSearchParams(await request.text());
  const tenantCode = formData.get('tenantCode');
  const actionType = formData.get("actionType");
  const { session, admin, redirect } = await authenticate.admin(request);
  console.log("action type is ", actionType)
  console.log("tenant code from action: ", tenantCode);
  if (actionType === 'signup') {
    console.log("new tenant code from UI form is : ", tenantCode);
    const validateTenantCodeResponse = await validateTenantCode(session.shop, tenantCode);
    console.log("validate tenant code response is ", validateTenantCodeResponse);
    console.log("validate tenant code response success ", validateTenantCodeResponse.successful);
    if (validateTenantCodeResponse.successful) {
      console.log("new generated tenantCode should be", validateTenantCodeResponse.tenantCode);
      const locationResponse = await getLocationForShop(session.shop, session.accessToken);
      const singleLocationDataShop = locationResponse.data.locations[0];

      const tenantCreationParams = {
        address1: singleLocationDataShop.address1 || 'Dummy',
        address2: singleLocationDataShop.address2 || '',
        city: singleLocationDataShop.city || 'Delhi',
        pincode: singleLocationDataShop.zip || '110001',
        state: singleLocationDataShop.province || 'Delhi',
        country: singleLocationDataShop.country || 'IN',
        locationId: singleLocationDataShop.id.toString() || ''
      };
      console.log("tenantCreationParams are ", tenantCreationParams);
      const saveTenantCreationParamsResponse = await saveTenantCreationParams(session, tenantCreationParams, admin);
      if (saveTenantCreationParamsResponse.successful) {
        setConfirmationUrl({ confirmationUrl: saveTenantCreationParamsResponse.data.confirmationUrl });
        // redirect(response.data.confirmationUrl, { target: "_parent" });
        console.log("executing redirect");
        return redirect('/app/uniwareConfirmation',{target:"_top"});
        // return {successful:true,"confirmationUrl": response.data.confirmationUrl}
      }
    }
    else {
      console.log("Validation failed:", response.error);
      return { "error": "Validation failed", "details": response.error, "status": 400 };
    }
  }
  else if (actionType === 'login') {
    return redirect("/app/uniwareLogin");
  }
};


export default function uniwareSignUpSignUpII() {
  const loaderData = useLoaderData();
  const [tenantCode, setTenantCode] = useSessionStorage('tenantCode', loaderData.tenantCode || '');
  // const linkRef = useRef(null);
  const formRef = useRef();
  // const fetcher = useFetcher();

  // const shopify = useAppBridge();

  // useEffect(() => {
  //   if (actionData?.tenantCode) {
  //     setTenantCode(actionData.phone);
  //   }
  // }, [actionData, setTenantCode]);

  const handleLoginClick = (actionType) => (e) => {
    e.preventDefault();
    console.log("Login from signup II.......");
    // fetcher.submit({ action: actionType }, { method: 'post' });

    const actionTypeInput = formRef.current.querySelector('input[name="actionType"]');
    actionTypeInput.value = 'login';
    formRef.current.submit();
  };

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
          <div>
            <img src="/images/tcns.jpeg" alt="TCNS" style={styles.logo} />
          </div>
          <div>
            <img src="/images/lenskart.png" alt="Lenskart" style={styles.logo} />
          </div>
          <div>
            <img src="/images/bestseller.png" alt="Bestseller" style={styles.logo} />
          </div>
          <div>
            <img src="/images/uc.png" alt="Boat" style={styles.logo} />
          </div>
          <div>
            <img src="/images/mamaearth.png" alt="Mamaearth" style={styles.logo} />
          </div>
          <div>
            <img src="/images/boat.png" alt="Boat" style={styles.logo} />
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div style={styles.rightSection}>
        <div style={styles.header}>
          <img src="/images/logo.svg" alt="Unicommerce Logo" style={{ width: "120px" }} />
          <h2 style={styles.h2}>Welcome to Unicommerce</h2>
          <p style={styles.instruction}>Sign Up below to create a new account.</p>
        </div>

        <Form method="post" ref={formRef} style={styles.formContainer}>
          <input type="hidden" name="actionType" value="signup" />
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
        <div style={{ textAlign: "center", marginTop: "1rem" }}>
          Already have an account?{" "}
          <button
            style={{
              background: "none",
              border: "none",
              color: "#1F87C2",
              textDecoration: "underline",
              cursor: "pointer"
            }}
            onClick={handleLoginClick('login')}
          >
            Log In
          </button>
        </div>
        <div style={styles.socialMedia}>
          <a href="https://www.linkedin.com/company/unicommerce/?originalSubdomain=in" target="_blank" rel="noopener noreferrer">
            <img src="/images/linkedin.png" alt="LinkedIn" style={styles.socialIcon} />
          </a>
          <a href="https://www.facebook.com/unicommerce/" target="_blank" rel="noopener noreferrer">
            <img src="/images/facebook.png" alt="Facebook" style={styles.socialIcon} />
          </a>
          <a href="https://www.youtube.com/channel/UCxghboEldMtQRVJxqCq6UHg" target="_blank" rel="noopener noreferrer">
            <img src="/images/youtube.jpg" alt="YouTube" style={styles.socialIcon} />
          </a>
          <a href="https://www.instagram.com/unicommerce_esolutions/?hl=en" target="_blank" rel="noopener noreferrer">
            <img src="/images/instagram.jpg" alt="Twitter" style={styles.socialIcon} />
          </a>
          <a href="https://x.com/Unicommerce_?ref_src=twsrc%5Egoogle%7Ctwcamp%5Eserp%7Ctwgr%5Eauthor" target="_blank" rel="noopener noreferrer">
            <img src="/images/twitter.jpg" alt="Twitter" style={styles.socialIcon} />
          </a>

        </div>

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
    // height: "168px",
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
    display: "grid",
    gridTemplateColumns: "repeat(6, 1fr)",
    gap: "0.5rem",
    width: "480px",
    height: "85px",
    borderRadius: "8px",
    overflow: "hidden",
    alignItems: "center",
    justifyItems: "center",
    backgroundColor: "#f9f9f9",
    padding: "0.5rem",
    marginTop: "1rem"
  },
  logo: {
    maxWidth: "100%",
    maxHeight: "100%",
    objectFit: "contain",
  },
  //   socialMedia: {
  //     position: "absolute",
  //     bottom: "2rem", // Positions 2rem from the bottom of rightSection
  //     left: "50%", // Positions it horizontally in the middle
  //     transform: "translateX(-50%)", // Adjusts for centering
  //     display: "flex",
  //     justifyContent: "center",
  //     alignItems: "center",
  //     gap: "0.5rem",
  //   },
  socialMedia: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginTop: "auto", // Pushes this div to the bottom
    gap: "0.5rem",
    padding: "1rem 0", // Add some padding at the bottom
  },
  socialIcon: {
    width: "30px",
    height: "26px",
    objectFit: "contain",
    cursor: "pointer",
  },
  rightSection: {
    width: "40%",
    height: "100%",
    backgroundColor: "#fff",
    borderRadius: "10px",
    padding: "2rem",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column", // Ensures child elements stack vertically
    // justifyContent: "space-between",
    // position: "relative"
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
  }
};