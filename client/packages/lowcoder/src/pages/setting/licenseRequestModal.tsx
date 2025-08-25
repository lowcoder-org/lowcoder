import { useState, useEffect } from "react";
import { Modal, Typography, Card, Space, Divider, Form, Input, Select, Radio, Button, message, Steps, Progress } from "antd";
import styled from "styled-components";
import Title from "antd/es/typography/Title";
import { trans } from "i18n";
import { useSelector } from "react-redux";
import { getUser } from "redux/selectors/usersSelectors";
import { getCurrentOrg } from "redux/selectors/orgSelectors";
import { getOrgApiUsage, getOrgLastMonthApiUsage } from "redux/selectors/orgSelectors";
import { getDeploymentId } from "@lowcoder-ee/redux/selectors/configSelectors";
import { submitLicenseRequest, LicenseRequestData } from "api/licenseRequestApi";

const { Paragraph, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const LicenseFormContainer = styled.div`
  max-width: 100%;
  width: 100%;
`;

const FormSection = styled.div`
  margin-bottom: 24px;
`;

const SectionTitle = styled(Title)`
  margin-bottom: 16px !important;
  color: #1890ff;
`;

const LicenseCard = styled(Card)`
  margin-bottom: 16px;
  border: 2px solid #f0f0f0;
  transition: all 0.3s;
  
  &:hover {
    border-color: #1890ff;
    box-shadow: 0 2px 8px rgba(24, 144, 255, 0.1);
  }
  
  &.selected {
    border-color: #1890ff;
    background-color: #f6ffed;
  }
`;

const UsageDisplay = styled.div`
  background: #f5f5f5;
  padding: 12px;
  border-radius: 6px;
  margin: 8px 0;
`;

const ThankYouContent = styled.div`
  text-align: center;
  padding: 40px 20px;
`;

const DownloadSection = styled.div`
  margin-top: 32px;
  padding: 24px;
  background: #f9f9f9;
  border-radius: 8px;
`;

interface Props {
  open: boolean;
  onClose: () => void;
  orgId: string;
  deploymentIds: string[];
}

interface CompanyDetails {
  companyName: string;
  address: string;
  registerNumber: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  taxId: string;
  vatId: string;
}

interface LicenseSelection {
  licenseType: 'per-api-calls' | 'per-instance';
  apiCallLimit?: number;
  instanceCount?: number;
}

interface FormData {
  companyDetails: CompanyDetails;
  licenseSelection: LicenseSelection;
  additionalNotes: string;
}

enum ModalStep {
  CompanyDetails = 0,
  LicenseSelection = 1,
  Review = 2,
  ThankYou = 3,
}

export function LicenseRequestModal({ open, onClose, orgId, deploymentIds }: Props) {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState<ModalStep>(ModalStep.CompanyDetails);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    companyDetails: {
      companyName: '',
      address: '',
      registerNumber: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      taxId: '',
      vatId: '',
    },
    licenseSelection: {
      licenseType: 'per-api-calls',
      apiCallLimit: 1000000,
    },
    additionalNotes: '',
  });

  const user = useSelector(getUser);
  const currentOrg = useSelector(getCurrentOrg);
  const apiUsage = useSelector(getOrgApiUsage);
  const lastMonthApiUsage = useSelector(getOrgLastMonthApiUsage);
  const deploymentId = useSelector(getDeploymentId);

  // Pre-fill company name if available
  useEffect(() => {
    if (currentOrg?.name && open) {
      form.setFieldsValue({
        'companyDetails.companyName': currentOrg.name,
      });
      setFormData(prev => ({
        ...prev,
        companyDetails: {
          ...prev.companyDetails,
          companyName: currentOrg.name,
        }
      }));
    }
  }, [currentOrg, open, form]);

  const handleCompanyDetailsSubmit = async (values: any) => {
    setFormData(prev => ({
      ...prev,
      companyDetails: values.companyDetails,
    }));
    setCurrentStep(ModalStep.LicenseSelection);
  };

  const handleLicenseSelectionSubmit = async (values: any) => {
    setFormData(prev => ({
      ...prev,
      licenseSelection: values.licenseSelection,
      additionalNotes: values.additionalNotes || '',
    }));
    setCurrentStep(ModalStep.Review);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Prepare data object for API
      const requestData: LicenseRequestData = {
        contactData: {
          ...formData.companyDetails,
          organizationId: orgId,
          deploymentIds: deploymentIds,
        },
        licenseType: formData.licenseSelection.licenseType,
        licenseData: {
          ...formData.licenseSelection,
          currentApiUsage: apiUsage,
          lastMonthApiUsage: lastMonthApiUsage,
        },
        organizationId: orgId,
        deploymentIds: deploymentIds,
        submittedAt: new Date().toISOString(),
        submittedBy: user.username,
      };

      // Submit to flow.lowcoder.cloud
      const response = await submitLicenseRequest(requestData);
      
      if (response.success) {
        message.success(response.message || 'License request submitted successfully!');
        setCurrentStep(ModalStep.ThankYou);
      } else {
        message.error(response.message || 'Failed to submit license request');
      }
    } catch (error) {
      message.error('Failed to submit license request. Please try again.');
      console.error('License request error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setCurrentStep(ModalStep.CompanyDetails);
    form.resetFields();
    onClose();
  };

  const renderCompanyDetailsStep = () => (
    <FormSection>
      <SectionTitle level={4}>{trans("enterprise.licenseRequest.companyDetails")}</SectionTitle>
      <Form.Item
        name={['companyDetails', 'companyName']}
        label={trans("enterprise.licenseRequest.companyName")}
        rules={[{ required: true, message: 'Please enter company name' }]}
      >
        <Input placeholder="Enter company name" />
      </Form.Item>
      
      <Form.Item
        name={['companyDetails', 'address']}
        label={trans("enterprise.licenseRequest.address")}
        rules={[{ required: true, message: 'Please enter company address' }]}
      >
        <TextArea rows={3} placeholder="Enter company address" />
      </Form.Item>
      
      <Form.Item
        name={['companyDetails', 'registerNumber']}
        label={trans("enterprise.licenseRequest.registerNumber")}
        rules={[{ required: true, message: 'Please enter register number' }]}
      >
        <Input placeholder="Enter register number" />
      </Form.Item>
      
      <Form.Item
        name={['companyDetails', 'contactName']}
        label={trans("enterprise.licenseRequest.contactPerson")}
        rules={[{ required: true, message: 'Please enter contact person name' }]}
      >
        <Input placeholder="Enter contact person name" />
      </Form.Item>
      
      <Form.Item
        name={['companyDetails', 'contactEmail']}
        label={trans("enterprise.licenseRequest.contactEmail")}
        rules={[
          { required: true, message: 'Please enter contact email' },
          { type: 'email', message: 'Please enter a valid email' }
        ]}
      >
        <Input placeholder="Enter contact email" />
      </Form.Item>
      
      <Form.Item
        name={['companyDetails', 'contactPhone']}
        label={trans("enterprise.licenseRequest.contactPhone")}
        rules={[{ required: true, message: 'Please enter contact phone' }]}
      >
        <Input placeholder="Enter contact phone" />
      </Form.Item>
      
      <Form.Item
        name={['companyDetails', 'taxId']}
        label={trans("enterprise.licenseRequest.taxId")}
      >
        <Input placeholder="Enter tax ID (optional)" />
      </Form.Item>
      
      <Form.Item
        name={['companyDetails', 'vatId']}
        label={trans("enterprise.licenseRequest.vatId")}
      >
        <Input placeholder="Enter VAT ID (optional)" />
      </Form.Item>
    </FormSection>
  );

  const renderLicenseSelectionStep = () => (
    <FormSection>
      <SectionTitle level={4}>{trans("enterprise.licenseRequest.licenseSelection")}</SectionTitle>
      
      <Form.Item
        name={['licenseSelection', 'licenseType']}
        label={trans("enterprise.licenseRequest.licenseType")}
        rules={[{ required: true, message: 'Please select license type' }]}
      >
        <Radio.Group>
          <Space direction="vertical">
            <LicenseCard 
              className={formData.licenseSelection.licenseType === 'per-api-calls' ? 'selected' : ''}
              onClick={() => form.setFieldsValue({ 'licenseSelection.licenseType': 'per-api-calls' })}
            >
              <Radio value="per-api-calls">
                <strong>{trans("enterprise.licenseRequest.perApiCalls")}</strong>
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary">{trans("enterprise.licenseRequest.payBasedOnUsage")}</Text>
                  <UsageDisplay>
                    <Text strong>{trans("enterprise.licenseRequest.currentUsage")}:</Text><br />
                    Overall: {apiUsage ? `${Intl.NumberFormat('en-GB').format(apiUsage)} API calls` : 'Loading...'}<br />
                    {trans("enterprise.licenseRequest.lastMonthUsage")}: {lastMonthApiUsage ? `${Intl.NumberFormat('en-GB').format(lastMonthApiUsage)} API calls` : 'Loading...'}
                  </UsageDisplay>
                </div>
              </Radio>
            </LicenseCard>
            
            <LicenseCard 
              className={formData.licenseSelection.licenseType === 'per-instance' ? 'selected' : ''}
              onClick={() => form.setFieldsValue({ 'licenseSelection.licenseType': 'per-instance' })}
            >
              <Radio value="per-instance">
                <strong>{trans("enterprise.licenseRequest.perInstance")}</strong>
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary">{trans("enterprise.licenseRequest.payPerInstance")}</Text>
                  <UsageDisplay>
                    <Text strong>{trans("enterprise.licenseRequest.currentDeployments")}:</Text><br />
                    {deploymentIds.length} deployment{deploymentIds.length !== 1 ? 's' : ''}
                  </UsageDisplay>
                </div>
              </Radio>
            </LicenseCard>
          </Space>
        </Radio.Group>
      </Form.Item>
      
      {formData.licenseSelection.licenseType === 'per-api-calls' && (
        <Form.Item
          name={['licenseSelection', 'apiCallLimit']}
          label={trans("enterprise.licenseRequest.apiCallLimit")}
          rules={[{ required: true, message: 'Please enter API call limit' }]}
        >
          <Select placeholder="Select API call limit">
            <Option value={100000}>100,000 calls/month</Option>
            <Option value={500000}>500,000 calls/month</Option>
            <Option value={1000000}>1,000,000 calls/month</Option>
            <Option value={5000000}>5,000,000 calls/month</Option>
            <Option value={10000000}>10,000,000 calls/month</Option>
            <Option value="custom">Custom limit</Option>
          </Select>
        </Form.Item>
      )}
      
      {formData.licenseSelection.licenseType === 'per-instance' && (
        <Form.Item
          name={['licenseSelection', 'instanceCount']}
          label={trans("enterprise.licenseRequest.instanceCount")}
          rules={[{ required: true, message: 'Please enter number of instances' }]}
        >
          <Input type="number" min={1} placeholder="Enter number of instances" />
        </Form.Item>
      )}
      
      <Form.Item
        name="additionalNotes"
        label={trans("enterprise.licenseRequest.additionalNotes")}
      >
        <TextArea rows={4} placeholder="Any additional requirements or questions..." />
      </Form.Item>
    </FormSection>
  );

  const renderReviewStep = () => (
    <FormSection>
      <SectionTitle level={4}>{trans("enterprise.licenseRequest.reviewSubmit")}</SectionTitle>
      
      <Card title={trans("enterprise.licenseRequest.companyDetails")} style={{ marginBottom: 16 }}>
        <Paragraph><strong>{trans("enterprise.licenseRequest.companyName")}:</strong> {formData.companyDetails.companyName}</Paragraph>
        <Paragraph><strong>{trans("enterprise.licenseRequest.address")}:</strong> {formData.companyDetails.address}</Paragraph>
        <Paragraph><strong>{trans("enterprise.licenseRequest.registerNumber")}:</strong> {formData.companyDetails.registerNumber}</Paragraph>
        <Paragraph><strong>{trans("enterprise.licenseRequest.contactPerson")}:</strong> {formData.companyDetails.contactName}</Paragraph>
        <Paragraph><strong>{trans("enterprise.licenseRequest.contactEmail")}:</strong> {formData.companyDetails.contactEmail}</Paragraph>
        <Paragraph><strong>{trans("enterprise.licenseRequest.contactPhone")}:</strong> {formData.companyDetails.contactPhone}</Paragraph>
        {formData.companyDetails.taxId && <Paragraph><strong>{trans("enterprise.licenseRequest.taxId")}:</strong> {formData.companyDetails.taxId}</Paragraph>}
        {formData.companyDetails.vatId && <Paragraph><strong>{trans("enterprise.licenseRequest.vatId")}:</strong> {formData.companyDetails.vatId}</Paragraph>}
      </Card>
      
      <Card title={trans("enterprise.licenseRequest.licenseSelection")} style={{ marginBottom: 16 }}>
        <Paragraph><strong>Type:</strong> {formData.licenseSelection.licenseType === 'per-api-calls' ? trans("enterprise.licenseRequest.perApiCalls") : trans("enterprise.licenseRequest.perInstance")}</Paragraph>
        {formData.licenseSelection.licenseType === 'per-api-calls' && (
          <Paragraph><strong>{trans("enterprise.licenseRequest.apiCallLimit")}:</strong> {formData.licenseSelection.apiCallLimit?.toLocaleString()} calls/month</Paragraph>
        )}
        {formData.licenseSelection.licenseType === 'per-instance' && (
          <Paragraph><strong>{trans("enterprise.licenseRequest.instanceCount")}:</strong> {formData.licenseSelection.instanceCount}</Paragraph>
        )}
        {formData.additionalNotes && <Paragraph><strong>{trans("enterprise.licenseRequest.additionalNotes")}:</strong> {formData.additionalNotes}</Paragraph>}
      </Card>
      
      <Card title="System Information">
        <Paragraph><strong>Organization ID:</strong> {orgId}</Paragraph>
        <Paragraph><strong>Deployment IDs:</strong> {deploymentIds.join(', ')}</Paragraph>
        <Paragraph><strong>Current API Usage:</strong> {apiUsage ? `${Intl.NumberFormat('en-GB').format(apiUsage)} calls` : 'Loading...'}</Paragraph>
        <Paragraph><strong>Last Month API Usage:</strong> {lastMonthApiUsage ? `${Intl.NumberFormat('en-GB').format(lastMonthApiUsage)} calls` : 'Loading...'}</Paragraph>
      </Card>
    </FormSection>
  );

  const renderThankYouStep = () => (
    <ThankYouContent>
      <Title level={2} style={{ color: '#52c41a' }}>Thank You!</Title>
      <Paragraph style={{ fontSize: '16px', marginBottom: '24px' }}>
        {trans("enterprise.licenseRequest.thankYouMessage")}
      </Paragraph>
      
      <DownloadSection>
        <Title level={4}>{trans("enterprise.licenseRequest.nextSteps")}</Title>
        <Paragraph>
          {trans("enterprise.licenseRequest.nextStepsDescription")}
        </Paragraph>
        <ul style={{ textAlign: 'left', maxWidth: '600px', margin: '0 auto' }}>
          <li>{trans("enterprise.licenseRequest.reviewDocs")} <a href="https://docs.lowcoder.cloud/lowcoder-documentation/setup-and-run/lowcoder-enterprise-edition" target="_blank" rel="noopener">Enterprise Edition documentation</a></li>
          <li>{trans("enterprise.licenseRequest.downloadRelease")} <a href="https://github.com/lowcoder-org/lowcoder-ee/releases" target="_blank" rel="noopener">latest Enterprise Edition release</a></li>
          <li>{trans("enterprise.licenseRequest.checkInstallGuide")} <a href="https://docs.lowcoder.cloud/lowcoder-documentation/setup-and-run/installation-guide" target="_blank" rel="noopener">installation guide</a></li>
        </ul>
      </DownloadSection>
    </ThankYouContent>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case ModalStep.CompanyDetails:
        return renderCompanyDetailsStep();
      case ModalStep.LicenseSelection:
        return renderLicenseSelectionStep();
      case ModalStep.Review:
        return renderReviewStep();
      case ModalStep.ThankYou:
        return renderThankYouStep();
      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case ModalStep.CompanyDetails:
        return trans("enterprise.licenseRequest.companyDetails");
      case ModalStep.LicenseSelection:
        return trans("enterprise.licenseRequest.licenseSelection");
      case ModalStep.Review:
        return trans("enterprise.licenseRequest.reviewSubmit");
      case ModalStep.ThankYou:
        return trans("enterprise.licenseRequest.requestSubmitted");
      default:
        return trans("enterprise.licenseRequest.title");
    }
  };

  const canGoBack = currentStep > 0 && currentStep < ModalStep.ThankYou;
  const canGoNext = currentStep < ModalStep.Review;
  const isLastStep = currentStep === ModalStep.Review;
  const isThankYouStep = currentStep === ModalStep.ThankYou;

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      width={800}
      destroyOnClose
      title={
        <div>
          <Title level={3} style={{ margin: 0 }}>{getStepTitle()}</Title>
          {currentStep < ModalStep.ThankYou && (
            <Progress 
              percent={((currentStep + 1) / 4) * 100} 
              showInfo={false}
              strokeColor="#1890ff"
              style={{ marginTop: 8 }}
            />
          )}
        </div>
      }
    >
      <LicenseFormContainer>
        <Form
          form={form}
          layout="vertical"
          onFinish={currentStep === ModalStep.CompanyDetails ? handleCompanyDetailsSubmit : handleLicenseSelectionSubmit}
        >
          {renderStepContent()}
          
          {!isThankYouStep && (
            <div style={{ textAlign: 'right', marginTop: 24 }}>
              <Space>
                {canGoBack && (
                  <Button onClick={handleBack}>
                    {trans("enterprise.licenseRequest.back")}
                  </Button>
                )}
                {canGoNext && (
                  <Button type="primary" htmlType="submit">
                    {trans("enterprise.licenseRequest.next")}
                  </Button>
                )}
                {isLastStep && (
                  <Button 
                    type="primary" 
                    loading={loading}
                    onClick={handleSubmit}
                  >
                    {trans("enterprise.licenseRequest.submitRequest")}
                  </Button>
                )}
              </Space>
            </div>
          )}
          
          {isThankYouStep && (
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <Button type="primary" onClick={handleClose}>
                {trans("enterprise.licenseRequest.close")}
              </Button>
            </div>
          )}
        </Form>
      </LicenseFormContainer>
    </Modal>
  );
}

export default LicenseRequestModal;
