import React, { useState, useEffect, useRef } from "react";
import { Button, TextField, Card, Layout } from "@shopify/polaris";
import { Form, useNavigate, useLoaderData, Link } from "@remix-run/react";
import { json, redirect as redirectRemix } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { getShopifyPlanDetails } from "../services/apiClient.server";
import { useActionData } from "@remix-run/react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Redirect } from "@shopify/app-bridge/actions";
import { createUniwareLoginSession } from "../services/loginService.server";

export const loader = async ({ request }) => {
  const { session, admin, redirect } = await authenticate.admin(request);

  const shopPlanDetails = await getShopifyPlanDetails(admin);
  if (shopPlanDetails.data.shop.plan.shopifyPlus) {
    throw redirectRemix("/app/denyLogin");
  }
  return json({ shopDetails: JSON.stringify(shopPlanDetails.data) });
};

export const action = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);

  const formData = await request.formData();
  const username = formData.get("username");
  const password = formData.get("password");

  const response = await createUniwareLoginSession(
    username,
    password,
    admin,
    session
  );
  if (response.successful) {
    if (response.data.confirmationUrl) {
      return { successful: true, confirmationUrl: response.data.confirmationUrl };
    } else if (response.data.chargeId) {
      return redirectRemix(`/app/processChargeCreation?chargeId=${response.data.charge_id}`);
    }
  }
  console.log("response is ", response.error);
  return response;
};

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const actionData = useActionData();
  const navigate = useNavigate();
  const loaderData = useLoaderData();
  const linkRef = useRef(null);

  const shopify = useAppBridge();
  const redirect = Redirect.create(shopify);

  useEffect(() => {
    if (actionData && actionData.confirmationUrl) {
      if (linkRef.current) {
        linkRef.current.click(); // Trigger the click on the Link
      }
    }
  }, [actionData]);

  const handleSignUpClick = () => {
    redirect.dispatch(Redirect.Action.ADMIN_PATH, "/app/uniwareSignUpI");
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
