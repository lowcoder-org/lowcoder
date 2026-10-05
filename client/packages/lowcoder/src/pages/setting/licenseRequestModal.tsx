import { useState, useEffect } from "react";
import { Modal, Typography, Card, Space, Divider, Form, Input, Select, Radio, Button, message, Steps, Progress } from "antd";
import styled from "styled-components";
import Title from "antd/es/typography/Title";
import { trans } from "i18n";
import { useSelector } from "react-redux";
import { getUser } from "redux/selectors/usersSelectors";
import { getCurrentOrg } from "redux/selectors/orgSelectors";
import { getOrgApiUsage, getOrgLastMonthApiUsage } from "redux/selectors/orgSelectors";
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
  licenseType?: 'per-api-calls' | 'per-instance';
  apiCallLimit?: number;
  apiCallLimits?: number[];
  instanceCount?: number;
  deploymentIds?: string[];
}

interface FormData {
  companyDetails: CompanyDetails;
  licenseSelection: LicenseSelection;
}

enum ModalStep {
  CompanyDetails = 0,
  LicenseSelection = 1,
  Review = 2,
  ThankYou = 3,
}

export function LicenseRequestModal({ open, onClose, orgId }: Props) {
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
      licenseType: undefined,
    },
  });

  const user = useSelector(getUser);
  const currentOrg = useSelector(getCurrentOrg);
  const apiUsage = useSelector(getOrgApiUsage);
  const lastMonthApiUsage = useSelector(getOrgLastMonthApiUsage);

  // Pre-fill company name if available
  useEffect(() => {
    if (currentOrg?.name && open && currentStep === ModalStep.CompanyDetails) {
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
  }, [currentOrg, open, currentStep, form]);

  // Reset modal state when modal is closed
  useEffect(() => {
    if (!open) {
      setCurrentStep(ModalStep.CompanyDetails);
      setFormData({
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
          licenseType: undefined,
        },
      });
      form.resetFields();
    }
  }, [open, form]);

  const handleLicenseTypeChange = (value: 'per-api-calls' | 'per-instance') => {
    setFormData(prev => ({
      ...prev,
      licenseSelection: {
        ...prev.licenseSelection,
        licenseType: value,
        // Reset deployment IDs and API call limits when switching license types
        deploymentIds: undefined,
        apiCallLimits: undefined,
      }
    }));
  };

  const handleInstanceCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const count = parseInt(e.target.value) || 0;
    
    // Update form data state
    setFormData(prev => ({
      ...prev,
      licenseSelection: {
        ...prev.licenseSelection,
        instanceCount: count,
        // For per-instance: create empty deployment IDs array
        // For per-api-calls: create deployment IDs array with current deployment ID repeated and empty API call limits array
        deploymentIds: count > 0 
          ? (prev.licenseSelection.licenseType === 'per-api-calls' 
              ? Array(count).fill('')
              : Array(count).fill('')
            )
          : undefined,
        apiCallLimits: count > 0 && prev.licenseSelection.licenseType === 'per-api-calls'
          ? Array(count).fill(undefined)
          : undefined,
      }
    }));
    
    // Also update the form field values
    if (count > 0) {
      const formValues: any = {};
      for (let i = 0; i < count; i++) {
        if (formData.licenseSelection.licenseType === 'per-api-calls') {
          formValues[`deploymentId_${i}`] = '';
          formValues[`apiCallLimit_${i}`] = undefined;
        } else {
          formValues[`deploymentId_${i}`] = '';
        }
      }
      form.setFieldsValue(formValues);
    }
  };

  const handleDeploymentIdChange = (index: number, value: string) => {
    // Update form data state
    setFormData(prev => ({
      ...prev,
      licenseSelection: {
        ...prev.licenseSelection,
        deploymentIds: prev.licenseSelection.deploymentIds?.map((id, i) => 
          i === index ? value : id
        ) || [],
      }
    }));
    
    // Also update the form field value
    form.setFieldsValue({
      [`deploymentId_${index}`]: value
    });
  };

  const handleApiCallLimitChange = (index: number, value: number) => {
    // Update form data state
    setFormData(prev => ({
      ...prev,
      licenseSelection: {
        ...prev.licenseSelection,
        apiCallLimits: prev.licenseSelection.apiCallLimits?.map((limit, i) => 
          i === index ? value : limit
        ) || [],
      }
    }));
    
    // Also update the form field value
    form.setFieldsValue({
      [`apiCallLimit_${index}`]: value
    });
  };

  const handleCompanyDetailsSubmit = async (values: any) => {
    setFormData(prev => ({
      ...prev,
      companyDetails: values.companyDetails,
    }));
    setCurrentStep(ModalStep.LicenseSelection);
  };

  const handleLicenseSelectionSubmit = async (values: any) => {
    if (!values.licenseSelection.licenseType) {
      message.error('Please select a license type');
      return;
    }
    
    // For per-instance licenses, capture deployment IDs from individual fields
    if (values.licenseSelection.licenseType === 'per-instance') {
      const deploymentIds: string[] = [];
      const instanceCount = values.licenseSelection.instanceCount || 0;

      // Collect deployment IDs from individual form fields
      for (let i = 0; i < instanceCount; i++) {
        const deploymentId = values[`deploymentId_${i}`];
        if (deploymentId) {
          deploymentIds.push(deploymentId);
        }
      }

      setFormData(prev => ({
        ...prev,
        licenseSelection: {
          ...values.licenseSelection,
          deploymentIds: deploymentIds,
        },
      }));
    } else {
      // For per-api-calls licenses, create deployment IDs and API call limits for each instance
      const instanceCount = values.licenseSelection.instanceCount || 0;
      const apiCallLimits: number[] = [];
      const deploymentIds: string[] = [];

      // Collect API call limits and deployment IDs from individual form fields
      for (let i = 0; i < instanceCount; i++) {
        const apiCallLimit = values[`apiCallLimit_${i}`];
        const deploymentId = values[`deploymentId_${i}`];

        if (apiCallLimit) {
          apiCallLimits.push(apiCallLimit);
        }
        if (deploymentId) {
          deploymentIds.push(deploymentId);
        }
      }

      setFormData(prev => ({
        ...prev,
        licenseSelection: {
          ...values.licenseSelection,
          deploymentIds: deploymentIds,
          apiCallLimits: apiCallLimits,
        },
      }));
    }
    
    setCurrentStep(ModalStep.Review);
  };

  const handleSubmit = async () => {
    if (!formData.licenseSelection.licenseType) {
      message.error('Please select a license type before submitting');
      return;
    }

    // Validate instance count for both license types
    if (!formData.licenseSelection.instanceCount || formData.licenseSelection.instanceCount <= 0) {
      message.error('Please enter a valid number of instances');
      return;
    }

    // Additional validation for per-instance licenses
    if (formData.licenseSelection.licenseType === 'per-instance') {

      if (!formData.licenseSelection.deploymentIds) {
        message.error('Deployment IDs are missing');
        return;
      }
      
      if (formData.licenseSelection.deploymentIds.length !== Number(formData.licenseSelection.instanceCount)) {
        message.error(`Expected ${formData.licenseSelection.instanceCount} deployment IDs, but got ${formData.licenseSelection.deploymentIds.length}`);
        return;
      }
      
      if (formData.licenseSelection.deploymentIds.some(id => !id || !id.trim())) {
        message.error('Please fill out all deployment IDs for each instance');
        return;
      }
    }

    // Additional validation for per-api-calls licenses
    if (formData.licenseSelection.licenseType === 'per-api-calls') {
      if (!formData.licenseSelection.apiCallLimits || formData.licenseSelection.apiCallLimits.length === 0) {
        message.error('Please select API call limits for all instances');
        return;
      }
      
      if (formData.licenseSelection.apiCallLimits.length !== Number(formData.licenseSelection.instanceCount)) {
        message.error(`Expected ${formData.licenseSelection.instanceCount} API call limits, but got ${formData.licenseSelection.apiCallLimits.length}`);
        return;
      }
      
      if (formData.licenseSelection.apiCallLimits.some(limit => !limit || limit <= 0)) {
        message.error('Please enter a valid API call limit for each instance');
        return;
      }
      
      if (!formData.licenseSelection.deploymentIds || formData.licenseSelection.deploymentIds.length === 0) {
        message.error('Please enter deployment IDs for all instances');
        return;
      }
      
      if (formData.licenseSelection.deploymentIds.length !== Number(formData.licenseSelection.instanceCount)) {
        message.error(`Expected ${formData.licenseSelection.instanceCount} deployment IDs, but got ${formData.licenseSelection.deploymentIds.length}`);
        return;
      }
      
      if (formData.licenseSelection.deploymentIds.some(id => !id || !id.trim())) {
        message.error('Please enter deployment IDs for all instances');
        return;
      }
    }

    setLoading(true);
    try {
      // Prepare data object for API
      const requestData: LicenseRequestData = {
        contactData: {
          ...formData.companyDetails,
          organizationId: orgId,
        },
        licenseType: formData.licenseSelection.licenseType,
        licenseData: {
          ...formData.licenseSelection,
          currentApiUsage: apiUsage,
          lastMonthApiUsage: lastMonthApiUsage,
        },
        organizationId: orgId,
        deploymentIds: formData.licenseSelection.deploymentIds || [],
      };

      setCurrentStep(ModalStep.ThankYou);
      // Submit to flow.lowcoder.cloud
      // const response = await submitLicenseRequest(requestData);
      
      // if (response.success) {
      //   message.success(response.message || 'License request submitted successfully!');
      //   setCurrentStep(ModalStep.ThankYou);
      // } else {
      //   message.error(response.message || 'Failed to submit license request');
      // }
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
    setFormData({
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
        licenseType: undefined,
      },
    });
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
        <TextArea rows={2} placeholder="Enter company address" />
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
        rules={[{ required: true, message: 'Please select a license type' }]}
      >
        <Radio.Group onChange={e => handleLicenseTypeChange(e.target.value)}>
          <Space direction="horizontal" size="large" style={{ width: '100%' }}>
            <LicenseCard 
              className={formData.licenseSelection.licenseType === 'per-api-calls' ? 'selected' : ''}
              style={{ flex: 1 }}
            >
              <Radio value="per-api-calls">
                <strong>{trans("enterprise.licenseRequest.perApiCalls")}</strong>
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary">Usage-based pricing — $0.001 per API Call</Text>
                </div>
              </Radio>
            </LicenseCard>
            
            <LicenseCard 
              className={formData.licenseSelection.licenseType === 'per-instance' ? 'selected' : ''}
              style={{ flex: 1 }}
            >
              <Radio value="per-instance">
                <strong>{trans("enterprise.licenseRequest.perInstance")}</strong>
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary">Flat-rate per instance — $169 / month</Text>
                </div>
              </Radio>
            </LicenseCard>
          </Space>
        </Radio.Group>
      </Form.Item>
      
      {formData.licenseSelection.licenseType === 'per-api-calls' && (
        <>
          <Form.Item
            name={['licenseSelection', 'instanceCount']}
            label={trans("enterprise.licenseRequest.instanceCount")}
            rules={[{ required: true, message: 'Please enter number of instances' }]}
          >
            <Input type="number" min={1} placeholder="Enter number of instances" onChange={handleInstanceCountChange} />
          </Form.Item>

          {formData.licenseSelection.instanceCount && formData.licenseSelection.instanceCount > 0 && (
            <Form.Item
              label="Instance Configuration"
              required
              style={{ marginTop: 16 }}
            >
              {Array.from({ length: formData.licenseSelection.instanceCount }, (_, index) => (
                <Card 
                  key={index} 
                  size="small" 
                  title={`Instance ${index + 1}`}
                  style={{ marginBottom: 16 }}
                >
                  <Form.Item
                    name={`deploymentId_${index}`}
                    label="Deployment ID"
                    rules={[{ required: true, message: `Please enter deployment ID for instance ${index + 1}` }]}
                    style={{ marginBottom: 8 }}
                  >
                    <Input 
                      placeholder={`Deployment ID for Instance ${index + 1}`}
                      defaultValue={''}
                    />
                  </Form.Item>
                  
                  <Form.Item
                    name={`apiCallLimit_${index}`}
                    label="Monthly API Call Limit"
                    rules={[{ required: true, message: `Please select API call limit for instance ${index + 1}` }]}
                  >
                    <Select placeholder="Select API call limit" onChange={(value) => handleApiCallLimitChange(index, value)}>
                      <Option value={100000}>100,000 calls/month — $100</Option>
                      <Option value={1000000}>1,000,000 calls/month — $1,000</Option>
                      <Option value={10000000}>10,000,000 calls/month — $10,000</Option>
                    </Select>
                  </Form.Item>
                </Card>
              ))}
            </Form.Item>
          )}
          
          <UsageDisplay>
            <Text strong>{trans("enterprise.licenseRequest.currentUsage")}:</Text><br />
            Overall: {apiUsage ? `${Intl.NumberFormat('en-GB').format(apiUsage)} API calls` : 'Loading...'}<br />
            {trans("enterprise.licenseRequest.lastMonthUsage")}: {lastMonthApiUsage ? `${Intl.NumberFormat('en-GB').format(lastMonthApiUsage)} API calls` : 'Loading...'}
          </UsageDisplay>
        </>
      )}
      
      {formData.licenseSelection.licenseType === 'per-instance' && (
        <div>
          <Form.Item
            name={['licenseSelection', 'instanceCount']}
            label={trans("enterprise.licenseRequest.instanceCount")}
            rules={[{ required: true, message: 'Please enter number of instances' }]}
            style={{ marginTop: 16 }}
          >
            <Input type="number" min={1} placeholder="Enter number of instances" onChange={handleInstanceCountChange} />
          </Form.Item>

          {formData.licenseSelection.instanceCount && formData.licenseSelection.instanceCount > 0 && (
            <Form.Item
              label="Deployment IDs"
              required
              style={{ marginTop: 16 }}
            >
              {Array.from({ length: formData.licenseSelection.instanceCount }, (_, index) => (
                <Form.Item
                  key={index}
                  name={`deploymentId_${index}`}
                  rules={[{ required: true, message: `Please enter deployment ID for instance ${index + 1}` }]}
                  style={{ marginBottom: 8 }}
                >
                  <Input 
                    placeholder={`Deployment ID for Instance ${index + 1}`}
                    addonBefore={`Instance ${index + 1}`}
                    onChange={(e) => handleDeploymentIdChange(index, e.target.value)}
                  />
                </Form.Item>
              ))}
            </Form.Item>
          )}

          <Text strong>Per Instance Details:</Text>
          <div style={{ marginTop: 8, padding: 12, background: '#f5f5f5', borderRadius: 6 }}>
            <Text>An instance is a full Lowcoder environment (metadata database + runtime) that can be independently deployed. This includes:</Text>
            <ul style={{ marginTop: 8, marginBottom: 0 }}>
              <li>A dedicated MongoDB metadata store</li>
              <li>One or more app runtimes ("Api-Service" and / or "Node-Service" containers)</li>
            </ul>
          </div>
        </div>
      )}
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
        <Paragraph><strong>{trans("enterprise.licenseRequest.instanceCount")}:</strong> {formData.licenseSelection.instanceCount}</Paragraph>
        <Paragraph><strong>Instance Deployment IDs:</strong> {formData.licenseSelection.deploymentIds?.join(', ')}</Paragraph>
        {formData.licenseSelection.licenseType === 'per-api-calls' && (
          <Paragraph><strong>Instance API Call Limits:</strong> {formData.licenseSelection.apiCallLimits?.map(limit => `${Intl.NumberFormat('en-GB').format(limit)} calls/month`).join(', ')}</Paragraph>
        )}
      </Card>
      
      <Card title="System Information">
        <Paragraph><strong>Organization ID:</strong> {orgId}</Paragraph>
        <Paragraph><strong>Instance Deployment IDs:</strong> {formData.licenseSelection.deploymentIds?.join(', ')}</Paragraph>
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
      destroyOnHidden
      title={
        <div>
          <Title level={3} style={{ margin: 0 }}>Enterprise License Request</Title>
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
