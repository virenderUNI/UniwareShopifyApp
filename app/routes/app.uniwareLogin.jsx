import React, { useState, useEffect, useRef } from "react";
import { Button, TextField, Card, Layout } from "@shopify/polaris";
import { Form, useNavigate, useLoaderData, Link } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { getShopifyPlanDetails } from "../services/apiClient.server";
import { useActionData } from "@remix-run/react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Redirect } from "@shopify/app-bridge/actions";
import { createUniwareLoginSession } from "../services/loginService.server";
import { setConfirmationUrl } from "../services/signUpService.server";

export const loader = async ({ request }) => {
  const { session, admin, redirect } = await authenticate.admin(request);

  const shopPlanDetails = await getShopifyPlanDetails(admin);
  if (shopPlanDetails.data.shop.plan.shopifyPlus) {
    throw redirect("/app/denyLogin");
  }
  return { "shopDetails": JSON.stringify(shopPlanDetails.data) };
};

export const action = async ({ request }) => {
  const { session, admin ,redirect } = await authenticate.admin(request);
  const formData = await request.formData();
  const tenantCode = formData.get("tenantCode");
  const username = formData.get("username");
  const password = formData.get("password");
  const actionType = formData.get("actionType"); 
 
  if(actionType == 'login'){
    const response = await createUniwareLoginSession(
      tenantCode,
      username,
      password,
      admin,
      session
    );
    console.log("createUniwareLoginSession : ",response);
    if (response.successful) {
      if (response.data.confirmationUrl) {
        setConfirmationUrl({ confirmationUrl: response.data.confirmationUrl })
        console.log("executing redirect");
        return redirect('/app/uniwareConfirmation', { target: "_parent" })
      } else if (response.data.chargeId) {
        return redirect(`/app/processChargeCreation?chargeId=${response.data.charge_id}`);
      }
    }
    return response;
  }else if(actionType == 'signup') {
    return redirect("/app/uniwareSignUpI");
  }
  // console.log("response is ", response.error);
};

export default function Login() {
  const [tenantCode, setTenantCode] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  // const [actionType, setActionType] = useState("login"); // Track action type
  const actionData = useActionData();
  const navigate = useNavigate();
  const loaderData = useLoaderData();
  const formRef = useRef(); 
  const linkRef = useRef(null);

  const shopify = useAppBridge();
  const redirect = Redirect.create(shopify);

  useEffect(() => {
    if (actionData && actionData.confirmationUrl) {
      if (linkRef.current) {
        linkRef.current.click(); 
      }
    }
  }, [actionData]);

  const handleSignUpClick = (e) => {
    e.preventDefault(); 
    const actionTypeInput = formRef.current.querySelector('input[name="actionType"]');
    actionTypeInput.value = "signup";
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
          <input type="hidden" name="actionType" value="login" />

          <TextField
            label={<span style={styles.customLabel}>Tenant Code</span>}
            value={tenantCode}
            onChange={(value) => setTenantCode(value)}
            placeholder="Enter your Tenant Code"
            type="text"
            name="tenantCode"
            autoComplete="tenantCode"
          />

          <TextField
            label={<span style={styles.customLabel}>Username</span>}
            value={username}
            onChange={(value) => setUsername(value)}
            placeholder="Enter your Username"
            type="text"
            name="username"
            autoComplete="username"
          />
          <TextField
            label={<span style={styles.customLabel}>Password</span>}
            value={password}
            onChange={(value) => setPassword(value)}
            placeholder="Enter your Password"
            type="password"
            name="password"
          />
          <Button submit primary fullWidth> 
            Log In
          </Button>
        </Form>
        <p style={{ textAlign: "center", marginTop: "1rem" }}>
          Don't have an account?{" "}
          <button
            style={{
              background: "none",
              border: "none",
              color: "#1F87C2",
              textDecoration: "underline",
              cursor: "pointer",
            }}
            onClick={handleSignUpClick}
          >
            Sign Up
          </button>
        </p>
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
  socialMedia: {
    position: "absolute",
    bottom: "2rem", // Positions 2rem from the bottom of rightSection
    left: "50%", // Positions it horizontally in the middle
    transform: "translateX(-50%)", // Adjusts for centering
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "0.5rem",
  },
  socialIcon: {
    width: "30px !important",
    height: "26px !important",
    objectFit:"contain",
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
    position: "relative"
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
  }
};
