import React, { useEffect, useState } from "react";
import { ArrowIcon } from "lowcoder-design";
import styled from "styled-components";
import { trans } from "i18n";
import { useParams } from "react-router-dom";
import { HeaderBack } from "../permission/styledComponents";
import history from "util/history";
import { SUBSCRIPTION_SETTING } from "constants/routesURL";
import { getProduct, getSubscriptionDetails, getInvoices } from "api/subscriptionApi";
import { Skeleton, Timeline, Card, Descriptions, Table, Typography, Button } from "antd";
import { useSubscriptionContext } from "@lowcoder-ee/util/context/SubscriptionContext";

const { Text } = Typography;

const Wrapper = styled.div`
  padding: 32px 24px;
`;

const InvoiceLink = styled.a`
  color: #1d39c4;
  &:hover {
    text-decoration: underline;
  }
`;

const CardWrapper = styled(Card)`
  width: 100%;
  margin-bottom: 24px;
`;

const TimelineWrapper = styled.div`
  margin-top: 24px;
`;

const ManageSubscriptionButton = styled(Button)`
  margin-top: 24px;
`;

export function SubscriptionDetail() {
  const { subscriptionId } = useParams<{ subscriptionId: string }>();
  const { productId } = useParams<{ productId: string }>();

  const [product, setProduct] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { subscriptionProducts } = useSubscriptionContext();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch product details if not found
        const product = subscriptionProducts.find(p => p.id === `prod_${productId}`);
        if (Boolean(product)) {
          setProduct(product);
        } else {
          const productData = await getProduct(productId);
          setProduct(productData);
        }

        // Fetch enriched subscription details, including usage records
        const subscriptionDetails = await getSubscriptionDetails(subscriptionId);
        setSubscription(subscriptionDetails);

        // Fetch invoices separately using the previous function
        const invoiceData = await getInvoices(subscriptionId);
        setInvoices(invoiceData);
      } catch (error) {
        console.error("Error loading subscription details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [subscriptionId, productId]);

  if (loading) {
    return <Skeleton style={{ margin: "40px" }} active paragraph={{ rows: 8 }} />;
  }

  // Extracting data from the enriched response
  const subscriptionDetails = subscription ? subscription[0] : {};
  const usageRecords = subscription ? subscription[1]?.data || [] : [];

  const statusColor = subscriptionDetails?.status === "active" ? "green" : "red";

  return (
    <Wrapper>
      <HeaderBack>
        <span onClick={() => history.push(SUBSCRIPTION_SETTING)}>
          {trans("settings.subscription")}
        </span>
        <ArrowIcon />
        <span>{trans("subscription.details")}</span>
      </HeaderBack>

      {/* Subscription Details Card */}
      <CardWrapper title={trans("subscription.subscriptionDetails")} style={{ marginTop: "40px" }}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label={trans("subscription.productName")}>
            {product?.name || "N/A"}
          </Descriptions.Item>
          <Descriptions.Item contentStyle={{ color: statusColor }} label={trans("subscription.status")}>
            {subscriptionDetails?.status || "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label={trans("subscription.startDate")}>
            {new Date(subscriptionDetails?.start_date * 1000).toLocaleDateString() || "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label={trans("subscription.currentPeriodEnd")}>
            {new Date(subscriptionDetails?.current_period_end * 1000).toLocaleDateString() || "N/A"}
          </Descriptions.Item>
        </Descriptions>
      </CardWrapper>

      {/* Invoice Information Card */}
      {invoices?.length > 0 ? (
        invoices.map((invoice: any) => (
          <CardWrapper key={invoice.id} title={`${trans("subscription.invoiceNumber")} - ${invoice.number}`}>
            {/* Invoice Summary */}
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label={trans("subscription.customer")}>
                {invoice.customer_name || invoice.customer_email}
              </Descriptions.Item>
              <Descriptions.Item label={trans("subscription.billingReason")}>
                {invoice.billing_reason === "subscription_cycle" ? trans("subscription.subscriptionCycle") : "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label={trans("subscription.status")}>
                <Text style={{ color: invoice.status === "paid" ? "green" : "red" }}>
                  {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label={trans("subscription.links")}>
                <InvoiceLink href={invoice.hosted_invoice_url} target="_blank" rel="noopener noreferrer">
                  {trans("subscription.viewInvoice")}
                </InvoiceLink>{" "}
                |{" "}
                <InvoiceLink href={invoice.invoice_pdf} target="_blank" rel="noopener noreferrer">
                  {trans("subscription.downloadPDF")}
                </InvoiceLink>
              </Descriptions.Item>
            </Descriptions>

            {/* Line Items Table */}
            <Table
              style={{ marginTop: "16px" }}
              dataSource={invoice.lines.data.filter((lineItem: any) => lineItem.amount !== 0)} // Filter out line items with amount = 0
              pagination={false}
              rowKey={(lineItem) => lineItem.id}
              columns={[
                {
                  title: trans("subscription.itemDescription"),
                  dataIndex: "description",
                  key: "description",
                },
                {
                  title: trans("subscription.amount"),
                  dataIndex: "amount",
                  key: "amount",
                  render: (amount: number) => `${(amount / 100).toFixed(2)} ${invoice.currency?.toUpperCase()}`,
                },
                {
                  title: trans("subscription.periodStart"),
                  dataIndex: ["period", "start"],
                  key: "period_start",
                  render: (start: number) => new Date(start * 1000).toLocaleDateString(),
                },
                {
                  title: trans("subscription.periodEnd"),
                  dataIndex: ["period", "end"],
                  key: "period_end",
                  render: (end: number) => new Date(end * 1000).toLocaleDateString(),
                },
              ]}
            />
          </CardWrapper>
        ))
      ) : (
        <CardWrapper title={trans("subscription.invoices")}>
          <p>{trans("subscription.noInvoices")}</p>
        </CardWrapper>
      )}

      {/* Cost/Volume Development Timeline */}
      <CardWrapper title={trans("subscription.costVolumeDevelopment")}>
        <TimelineWrapper>
          <Timeline>
            {usageRecords?.length > 0 ? (
              usageRecords.map((record: any, index: number) => (
                <Timeline.Item key={index} color={record.total_usage > 0 ? "green" : "gray"}>
                  {`Usage for ${record.total_usage} units on ${new Date(record.period.start * 1000).toLocaleDateString()}`}
                </Timeline.Item>
              ))
            ) : (
              <Timeline.Item color="gray">{trans("subscription.noUsageRecords")}</Timeline.Item>
            )}
          </Timeline>
        </TimelineWrapper>
      </CardWrapper>

      <CardWrapper title={trans("subscription.subscriptionHelp")}>
        <span>{trans("subscription.subscriptionHelpDescription")}</span>
      </CardWrapper>

      <br/><br/>
    </Wrapper>
  );
}

export default SubscriptionDetail;
