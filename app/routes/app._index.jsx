import { useState, useEffect } from "react";
import { useLoaderData, useNavigate, useActionData, useSubmit } from "@remix-run/react";
import { useAppBridge } from "@shopify/app-bridge-react";
import {
  Page,
  Layout,
  Card,
  Text,
  Button,
  BlockStack,
  InlineStack,
  Badge,
  Icon,
  Collapsible,
  List,
  Banner,
  Divider,
  Box,
  TextField,
} from "@shopify/polaris";
import {
  ProductIcon,
  SettingsIcon,
  ThemeIcon,
  ExternalIcon,
  CheckIcon,
  InfoIcon,
  QuestionCircleIcon,
  ViewIcon,
  DeleteIcon,
} from '@shopify/polaris-icons';
import { authenticate } from "../shopify.server";
import { json } from "@remix-run/node";

// Action function to handle product deletion
export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  try {
    const formData = await request.formData();
    const actionType = formData.get("actionType");
    const productId = formData.get("productId");

    if (actionType === "delete" && productId) {
      // Delete all metafields for this product
      const METAFIELD_NAMESPACE = "bl_custom_button";

      // First, get existing metafields
      const getMetafieldsQuery = `
        query getProductMetafields($id: ID!) {
          product(id: $id) {
            title
            metafields(first: 20, namespace: "${METAFIELD_NAMESPACE}") {
              nodes {
                key
              }
            }
          }
        }
      `;

      const metafieldsResponse = await admin.graphql(getMetafieldsQuery, {
        variables: { id: productId }
      });

      const metafieldsData = await metafieldsResponse.json();
      const product = metafieldsData.data?.product;
      const existingMetafields = product?.metafields?.nodes || [];

      if (existingMetafields.length > 0) {
        const deleteMetafieldsMutation = `
          mutation metafieldsDelete($metafields: [MetafieldIdentifierInput!]!) {
            metafieldsDelete(metafields: $metafields) {
              deletedMetafields {
                key
                namespace
                ownerId
              }
              userErrors {
                field
                message
              }
            }
          }
        `;

        const metafieldIdentifiers = existingMetafields.map(mf => ({
          ownerId: productId,
          namespace: METAFIELD_NAMESPACE,
          key: mf.key
        }));

        const deleteResponse = await admin.graphql(deleteMetafieldsMutation, {
          variables: {
            metafields: metafieldIdentifiers
          }
        });

        const deleteData = await deleteResponse.json();

        if (deleteData.data?.metafieldsDelete?.userErrors?.length > 0) {
          console.error("Delete errors:", deleteData.data.metafieldsDelete.userErrors);
          return json({
            error: "Failed to delete product configuration",
            success: false
          });
        }

        console.log(`Deleted configuration for product: ${product?.title}`);
        return json({
          success: true,
          message: `Configuration for "${product?.title}" has been removed successfully.`
        });
      } else {
        return json({
          success: true,
          message: "Product configuration was already removed."
        });
      }
    }

    return json({ error: "Invalid action", success: false });
  } catch (error) {
    console.error("Error in action:", error);
    return json({
      error: "Failed to delete product configuration: " + error.message,
      success: false
    });
  }
};

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);

  // Pobierz dane o aktywnym motywie
  let themeEditorUrl = null;
  try {
    const themeQuery = `
      query getThemes {
        themes(first: 10) {
          nodes {
            id
            name
            role
          }
        }
      }
    `;

    const themeResponse = await admin.graphql(themeQuery);
    const themeData = await themeResponse.json();

    if (themeData.data?.themes?.nodes) {
      const activeTheme = themeData.data.themes.nodes.find(theme => theme.role === 'MAIN');
      if (activeTheme) {
        // Generuj URL do edytora motywu - usuwamy "gid://shopify/Theme/" z ID
        const themeId = activeTheme.id.replace('gid://shopify/Theme/', '');
        themeEditorUrl = `https://${session.shop}/admin/themes/${themeId}/editor`;
      }
    }
  } catch (error) {
    console.error("Error fetching theme data:", error);
    // Fallback - użyj ogólnego URL do motywów
    themeEditorUrl = `https://${session.shop}/admin/themes`;
  }

  // Pobierz produkty z skonfigurowanymi zewnętrznymi linkami
  let configuredProducts = [];
  try {
    const productsQuery = `
      query getProductsWithMetafields($namespace: String!) {
        products(first: 100) {
          nodes {
            id
            title
            handle
            featuredImage {
              url
              altText
            }
            metafields(first: 10, namespace: $namespace) {
              nodes {
                id
                namespace
                key
                value
                type
              }
            }
          }
        }
      }
    `;

    console.log("Fetching products with metafields...");
    const productsResponse = await admin.graphql(productsQuery, {
      variables: { namespace: "bl_custom_button" }
    });

    const productsData = await productsResponse.json();
    console.log("Products response:", JSON.stringify(productsData, null, 2));

    if (productsData.data?.products?.nodes) {
      const allProducts = productsData.data.products.nodes;
      console.log("Total products found:", allProducts.length);

      configuredProducts = allProducts.map(product => {
        const metafields = product.metafields?.nodes || [];
        const metafieldMap = {};

        metafields.forEach(mf => {
          metafieldMap[mf.key] = mf.value;
        });

        console.log(`Product ${product.title} metafields:`, metafieldMap);

        // Support both old and new format
        let externalLinks = [];
        let buttonText = "";
        let externalUrl = "";
        let isEnabled = false;

        // Try new format first (external_links JSON)
        if (metafieldMap["external_links"]) {
          try {
            externalLinks = JSON.parse(metafieldMap["external_links"]);
            // For display purposes, use the first enabled link
            const enabledLink = externalLinks.find(link => link.enabled !== false);
            if (enabledLink) {
              buttonText = enabledLink.text || "";
              externalUrl = enabledLink.url || "";
              isEnabled = true;
            }
          } catch (error) {
            console.error(`Error parsing external links JSON for ${product.title}:`, error);
          }
        }
        // Fallback to old format (individual metafields)
        else {
          buttonText = metafieldMap["button_text"] || "";
          externalUrl = metafieldMap["external_url"] || "";
          isEnabled = metafieldMap["is_enabled"] === "true";
        }

        return {
          id: product.id,
          title: product.title,
          handle: product.handle,
          featuredImage: product.featuredImage,
          externalUrl: externalUrl,
          buttonText: buttonText,
          isEnabled: isEnabled,
          hideAtc: metafieldMap["hide_atc"] === "true" || metafieldMap["hide_atc"] === "true",
          hasMetafields: metafields.length > 0,
          hasMultipleLinks: externalLinks.length > 1
        };
      }).filter(product => product.hasMetafields && (product.externalUrl || product.buttonText)); // Only show products with metafields and some configuration

      console.log("Products with metafields:", configuredProducts.length);
    }

    console.log("Final configured products:", configuredProducts);
  } catch (error) {
    console.error("Error fetching configured products:", error);
  }

  return json({ themeEditorUrl, configuredProducts, shopDomain: session.shop });
};

export default function Index() {
  const loaderData = useLoaderData() || {};
  const actionData = useActionData();
  const themeEditorUrl = loaderData.themeEditorUrl || "#";
  const configuredProducts = loaderData.configuredProducts || [];
  const shopDomain = loaderData.shopDomain || "";
  const navigate = useNavigate();
  const submit = useSubmit();
  const shopify = useAppBridge();

  const [setupOpen, setSetupOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handlePreviewProduct = (handle) => {
    const previewUrl = `https://${shopDomain}/products/${handle}`;
    window.open(previewUrl, '_blank');
  };

  // Handle action data effects
  useEffect(() => {
    if (actionData?.success) {
      shopify?.toast?.show(actionData.message, { duration: 5000 });
      setIsDeleting(false);
    } else if (actionData?.error) {
      shopify?.toast?.show(actionData.error, { isError: true, duration: 5000 });
      setIsDeleting(false);
    }
  }, [actionData, shopify]);

  const handleDeleteClick = (product) => {
    const modal = document.getElementById('delete-modal');
    modal.show();

    // Store product data for later use
    modal.setAttribute('data-product-id', product.id);
    modal.setAttribute('data-product-title', product.title);
  };

  const confirmDelete = () => {
    const modal = document.getElementById('delete-modal');
    const productId = modal.getAttribute('data-product-id');
    const productTitle = modal.getAttribute('data-product-title');

    modal.hide();

    setIsDeleting(true);
    const formData = new FormData();
    formData.set("actionType", "delete");
    formData.set("productId", productId);
    submit(formData, { method: "post" });
    shopify?.toast?.show(`Deleting configuration for "${productTitle}"...`, { duration: 2000 });
  };

  const cancelDelete = () => {
    const modal = document.getElementById('delete-modal');
    modal.hide();
  };

  // Function to truncate URL for better display
  const truncateUrl = (url, maxLength = 50) => {
    if (!url || url.length <= maxLength) return url;

    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      const path = urlObj.pathname + urlObj.search;

      if (domain.length + 10 >= maxLength) {
        return domain + '...';
      }

      const availableLength = maxLength - domain.length - 3; // 3 for "..."
      if (path.length > availableLength) {
        return domain + path.substring(0, availableLength) + '...';
      }

      return url;
    } catch {
      // If URL parsing fails, just truncate the string
      return url.substring(0, maxLength - 3) + '...';
    }
  };

  return (
    <Page
      title="DC External Links"
      primaryAction={{
        content: "Configure products",
        onAction: () => navigate("/app/product-config"),
        icon: ProductIcon
      }}
    >
      <Layout>
        {/* Banner powitalny */}
        <Layout.Section>
          <Banner
            title="Welcome to DC External Links"
            tone="success"
            icon={CheckIcon}
          >
            <Text variant="bodyMd">
              Add external affiliate links to your products, replacing the standard "Add to cart" button
              with custom buttons that redirect to external pages.
            </Text>
          </Banner>
        </Layout.Section>

        {/* Configured Products Management */}
        <Layout.Section>
          <Card sectioned>
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <Text variant="headingMd" as="h2">Configured products</Text>
                <InlineStack gap="200" blockAlign="center">
                  <Badge tone={configuredProducts.length > 0 ? "success" : "info"}>
                    {configuredProducts.length} configured
                  </Badge>
                  <Button
                    variant="primary"
                    size="medium"
                    onClick={() => navigate("/app/product-config")}
                    icon={ProductIcon}
                  >
                    Add Product
                  </Button>
                </InlineStack>
              </InlineStack>

              {configuredProducts.length > 0 ? (
                <BlockStack gap="300">
                  {configuredProducts.map((product) => (
                    <Card key={product.id} sectioned>
                      <InlineStack align="space-between" blockAlign="start" gap="400">
                        <InlineStack gap="300" blockAlign="center">
                          {product.featuredImage && (
                            <div style={{ flexShrink: 0 }}>
                              <img
                                src={product.featuredImage.url}
                                alt={product.featuredImage.altText || ""}
                                style={{
                                  width: "40px",
                                  height: "40px",
                                  objectFit: "cover",
                                  borderRadius: "4px"
                                }}
                              />
                            </div>
                          )}
                          <BlockStack gap="200">
                            <Text variant="bodyLg" fontWeight="semibold">
                              {product.title}
                            </Text>
                            <InlineStack gap="200" blockAlign="center" wrap={false}>
                              <Badge tone={product.isEnabled ? "success" : "critical"}>
                                {product.isEnabled ? "Enabled" : "Disabled"}
                              </Badge>
                              {product.hasMultipleLinks && (
                                <Badge tone="info">
                                  Multiple links
                                </Badge>
                              )}
                              {product.buttonText && (
                                <Text variant="bodyMd" tone="subdued">
                                  Button: "{product.buttonText}"
                                </Text>
                              )}
                            </InlineStack>
                            {product.externalUrl && (
                              <InlineStack gap="100" blockAlign="center">
                                <Icon source={ExternalIcon} />
                                <Text
                                  variant="bodyMd"
                                  tone="subdued"
                                  title={product.externalUrl}
                                  style={{
                                    wordBreak: 'break-all',
                                    maxWidth: '400px'
                                  }}
                                >
                                  {truncateUrl(product.externalUrl, 60)}
                                </Text>
                              </InlineStack>
                            )}
                          </BlockStack>
                        </InlineStack>

                        <InlineStack gap="200">
                          <Button
                            variant="secondary"
                            size="medium"
                            onClick={() => navigate(`/app/product-config?productId=${product.id}`)}
                            icon={SettingsIcon}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="secondary"
                            size="medium"
                            onClick={() => handlePreviewProduct(product.handle)}
                            icon={ViewIcon}
                          >
                            Preview
                          </Button>
                          <Button
                            variant="secondary"
                            size="medium"
                            tone="critical"
                            onClick={() => handleDeleteClick(product)}
                            icon={DeleteIcon}
                          >
                            Delete
                          </Button>
                        </InlineStack>
                      </InlineStack>
                    </Card>
                  ))}
                </BlockStack>
              ) : (
                <BlockStack gap="300">
                  <Text variant="bodyMd" tone="subdued">
                    No products configured yet. Start by configuring your first product.
                  </Text>
                  <InlineStack gap="200">
                    <Button
                      variant="primary"
                      icon={ProductIcon}
                      onClick={() => navigate("/app/product-config")}
                    >
                      Configure first product
                    </Button>
                  </InlineStack>
                </BlockStack>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Status aplikacji */}
        <Layout.Section>
          <Card sectioned>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">App status</Text>
              <BlockStack gap="300">
                <InlineStack gap="200" blockAlign="center">
                  <Badge tone="success">Active</Badge>
                  <Text>App installed and running</Text>
                </InlineStack>
                <InlineStack gap="200" blockAlign="center">
                  <Badge tone="success">Ready</Badge>
                  <Text>Theme extension available</Text>
                </InlineStack>
                <InlineStack gap="200" blockAlign="center">
                  <Badge tone="info">Setup</Badge>
                  <Text>Ready for product configuration</Text>
                </InlineStack>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Instrukcje krok po kroku */}
        <Layout.Section>
          <Card sectioned>
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <Text variant="headingMd" as="h2">Setup instructions</Text>
                <Button
                  variant="plain"
                  onClick={() => setSetupOpen(!setupOpen)}
                  ariaExpanded={setupOpen}
                  ariaControls="setup-collapsible"
                >
                  {setupOpen ? 'Hide' : 'Show'}
                </Button>
              </InlineStack>

              <Collapsible
                open={setupOpen}
                id="setup-collapsible"
                transition={{ duration: '150ms', timingFunction: 'ease' }}
              >
                <BlockStack gap="400">
                  {/* Krok 1 */}
                  <Card sectioned>
                    <BlockStack gap="300">
                      <InlineStack gap="200" blockAlign="center">
                        <Badge tone="info">Step 1</Badge>
                        <Text variant="bodyLg" fontWeight="semibold">Configure products</Text>
                      </InlineStack>
                      <Text>
                        Go to Product Configuration and select products you want to add external affiliate links to.
                        Set the destination URL and button text for each product.
                      </Text>
                      <InlineStack gap="200">
                        <Button
                          icon={ProductIcon}
                          onClick={() => navigate("/app/product-config")}
                        >
                          Configure products
                        </Button>
                      </InlineStack>
                    </BlockStack>
                  </Card>

                  {/* Krok 2 */}
                  <Card sectioned>
                    <BlockStack gap="300">
                      <InlineStack gap="200" blockAlign="center">
                        <Badge tone="success">Step 2</Badge>
                        <Text variant="bodyLg" fontWeight="semibold">Buttons appear automatically</Text>
                      </InlineStack>
                      <Text>
                        Once you configure products, external buttons will automatically appear on those product pages.
                        No manual setup required in the theme editor.
                      </Text>
                      <Text variant="bodyMd" tone="subdued">
                        Optional: You can customize button appearance and position in the theme editor by modifying the "External Button" block.
                      </Text>
                    </BlockStack>
                  </Card>

                  {/* Krok 3 */}
                  <Card sectioned>
                    <BlockStack gap="300">
                      <InlineStack gap="200" blockAlign="center">
                        <Badge tone="success">Step 3</Badge>
                        <Text variant="bodyLg" fontWeight="semibold">Test and publish</Text>
                      </InlineStack>
                      <Text>
                        Visit your product pages to verify that external buttons are displaying correctly and redirecting to the configured URLs.
                      </Text>
                      <List type="bullet">
                        <List.Item>Check that buttons appear on configured product pages</List.Item>
                        <List.Item>Test external redirects work as expected</List.Item>
                        <List.Item>Verify "Hide cart button" feature works if enabled</List.Item>
                        <List.Item>Publish changes when ready</List.Item>
                      </List>
                    </BlockStack>
                  </Card>
                </BlockStack>
              </Collapsible>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* FAQ */}
        <Layout.Section>
          <Card sectioned>
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <Text variant="headingMd" as="h2">Frequently asked questions</Text>
                <Button
                  variant="plain"
                  onClick={() => setFaqOpen(!faqOpen)}
                  ariaExpanded={faqOpen}
                  ariaControls="faq-collapsible"
                >
                  {faqOpen ? 'Hide' : 'Show'}
                </Button>
              </InlineStack>

              <Collapsible
                open={faqOpen}
                id="faq-collapsible"
                transition={{ duration: '150ms', timingFunction: 'ease' }}
              >
                <BlockStack gap="400">
                  <Card sectioned>
                    <BlockStack gap="200">
                      <Text variant="bodyMd" fontWeight="semibold">
                        Why don't I see the external buttons on my product pages?
                      </Text>
                      <Text>
                        External buttons appear automatically once you configure them in Product Configuration.
                        If you don't see them, make sure you've added at least one enabled external link for the product.
                        The buttons will show up on the product page without requiring any manual theme setup.
                      </Text>
                    </BlockStack>
                  </Card>

                  <Card sectioned>
                    <BlockStack gap="200">
                      <Text variant="bodyMd" fontWeight="semibold">
                        How does hiding "Add to cart" buttons work?
                      </Text>
                      <Text>
                        The feature automatically attempts to hide standard cart buttons using common CSS selectors.
                        Some themes may require additional configuration or may not support this feature.
                      </Text>
                    </BlockStack>
                  </Card>



                  <Card sectioned>
                    <BlockStack gap="200">
                      <Text variant="bodyMd" fontWeight="semibold">
                        Will the block work with all themes?
                      </Text>
                      <Text>
                        The block is compatible with most modern Shopify themes, but appearance may vary.
                        You can customize styles in the block settings within the theme editor.
                      </Text>
                    </BlockStack>
                  </Card>
                </BlockStack>
              </Collapsible>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Wsparcie */}
        <Layout.Section>
          <Card sectioned>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">Need help?</Text>
              <Text>
                If you have issues with configuration or app functionality, check the browser console logs
                or contact technical support.
              </Text>
              <InlineStack gap="200">
                <Button variant="secondary" icon={InfoIcon}>
                  Documentation
                </Button>
                <Button variant="secondary" icon={ExternalIcon}>
                  Report issue
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>

      {/* Delete confirmation modal */}
      <ui-modal id="delete-modal" variant="small">
        <div style={{ padding: '20px' }}>
          <Text variant="bodyMd">
            Are you sure you want to delete this product configuration?
          </Text>
          <br />
          <br />
          <Text variant="bodyMd" tone="subdued">
            This will remove all external links and settings for this product. This action cannot be undone.
          </Text>
          <br />
          <br />
          <Text variant="bodyMd" tone="subdued">
            The product will be removed from the configured products list.
          </Text>
        </div>
        <ui-title-bar title="Delete product configuration">
          <button variant="primary" tone="critical" onClick={confirmDelete}>
            Delete
          </button>
          <button onClick={cancelDelete}>Cancel</button>
        </ui-title-bar>
      </ui-modal>
    </Page>
  );
}