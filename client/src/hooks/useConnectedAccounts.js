import { useState, useEffect } from 'react';
import { callStripe } from '../services/stripeApi';

export function useConnectedAccounts(stripeSecretKey) {
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [connectedAccountsLoading, setConnectedAccountsLoading] = useState(true);
  const [connectedAccountsError, setConnectedAccountsError] = useState("");

  useEffect(() => {
    let isCancelled = false;

    const loadAccounts = async () => {
      if (!stripeSecretKey || !stripeSecretKey.startsWith("sk_")) {
        setConnectedAccountsLoading(false);
        setConnectedAccountsError(
          "Enter your Stripe platform secret key to load connected accounts."
        );
        return;
      }
      try {
        setConnectedAccountsLoading(true);
        setConnectedAccountsError("");
        const all = [];
        let startingAfter = "";
        let hasMore = true;
        let pageCount = 0;
        const maxPages = 10;

        while (hasMore && all.length < 200 && pageCount < maxPages) {
          if (isCancelled) {
            return;
          }

          const query = startingAfter
            ? `/accounts?limit=100&starting_after=${startingAfter}`
            : "/accounts?limit=100";

          const res = await callStripe(query, {}, stripeSecretKey);

          if (isCancelled) {
            return;
          }

          if (!res || typeof res !== "object") {
            console.error("Unexpected API response structure:", res);
            throw new Error("Invalid response from Stripe API");
          }

          const page = Array.isArray(res.data) ? res.data : [];
          all.push(...page);
          hasMore = !!res.has_more && page.length > 0;
          pageCount++;

          if (page.length > 0) {
            startingAfter = page[page.length - 1].id;
          } else {
            hasMore = false;
          }

          if (page.length === 0 && startingAfter) {
            hasMore = false;
          }
        }

        if (isCancelled) {
          return;
        }

        const mapped = all.map((acct) => {
          const name =
            acct.business_profile?.name ||
            acct.business_profile?.support_email ||
            acct.email ||
            acct.id;
          return {
            id: acct.id,
            label: name,
          };
        });
        setConnectedAccounts(mapped);
        if (mapped.length === 0) {
          setConnectedAccountsError(
            "No connected accounts found. This key may not have access to connected accounts, or you may not have any connected accounts set up."
          );
        }
      } catch (err) {
        if (!isCancelled) {
          console.error("Error loading connected accounts:", err);
          setConnectedAccountsError(
            err.message ||
              "Unable to load connected accounts from Stripe. Please check your API key permissions."
          );
          setConnectedAccounts([]);
        }
      } finally {
        if (!isCancelled) {
          setConnectedAccountsLoading(false);
        }
      }
    };

    loadAccounts();

    return () => {
      isCancelled = true;
    };
  }, [stripeSecretKey]);

  return {
    connectedAccounts,
    connectedAccountsLoading,
    connectedAccountsError,
  };
}

