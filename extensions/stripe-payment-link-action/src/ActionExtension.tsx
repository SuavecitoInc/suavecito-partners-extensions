import { useEffect, useState } from 'react';
import {
  reactExtension,
  useApi,
  AdminAction,
  BlockStack,
  Button,
  Text,
} from '@shopify/ui-extensions-react/admin';

// The target used here must match the target used in the extension's toml file (./shopify.extension.toml)
const TARGET = 'admin.order-details.action.render';

export default reactExtension(TARGET, () => <App />);

function App() {
  // The useApi hook provides access to several useful APIs like i18n, close, and data.
  const { i18n, close, data } = useApi(TARGET);
  console.log({ data });
  const [paymentIntent, setPaymentIntent] = useState('');

  // Use direct API calls to fetch data from Shopify.
  // See https://shopify.dev/docs/api/admin-graphql for more information about Shopify's GraphQL API
  useEffect(() => {
    (async function getOrderInfo() {
      console.log('getting order id');
      console.log('id', data.selected[0].id);
      const getOrderQuery = {
        query: `query orderById($id: ID!) {
          order(id: $id) {
            pi: metafield(namespace: "suavecito", key: "stripe_payment_intent") {
              value
            }
          }
        }`,
        variables: { id: data.selected[0].id },
      };

      const res = await fetch('shopify:admin/api/graphql.json', {
        method: 'POST',
        body: JSON.stringify(getOrderQuery),
      });

      if (!res.ok) {
        console.error('Network error');
      }

      const orderData = await res.json();
      const pi = orderData?.data?.order?.pi?.value;
      console.log('pi', pi);
      if (pi) {
        setPaymentIntent(pi);
      }
    })();
  }, [data.selected]);

  return (
    // The AdminAction component provides an API for setting the title and actions of the Action extension wrapper.
    <AdminAction
      primaryAction={
        <Button
          href={`https://dashboard.stripe.com/payments/${paymentIntent}`}
          disabled={!paymentIntent || paymentIntent === ''}
        >
          View Payment
        </Button>
      }
      secondaryAction={
        <Button
          onPress={() => {
            console.log('closing');
            close();
          }}
        >
          Done
        </Button>
      }
    >
      <BlockStack>
        {/* Set the translation values for each supported language in the locales directory */}
        <Text fontWeight="bold">{i18n.translate('message')}</Text>
        <Text>
          Make sure you are logged into Stripe and the correct account is
          selected. Otherwise you will get a transaction not found error.
        </Text>
      </BlockStack>
    </AdminAction>
  );
}
