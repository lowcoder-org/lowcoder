import { ReactNode, useEffect, useState } from "react";
import { ArrowIcon } from "lowcoder-design";
import styled from "styled-components";
import { trans } from "i18n";
import { useParams } from "react-router-dom";
import { Descriptions, Tag, Avatar, Skeleton, Button, Typography, List, Table, Progress, Input, Upload, message } from "antd";
import { UploadOutlined } from '@ant-design/icons';
import history from "util/history";
import { getTicket, updateTicketDescription, addComment, uploadAttachment } from '@lowcoder-ee/api/supportApi'; // Placeholder for your API functions
import { Level1SettingPageContent, Level1SettingPageTitle } from "../setting/styled";
import { HeaderBack } from "../setting/permission/styledComponents";
import { SUPPORT_URL } from "constants/routesURL";
import { TacoMarkDown } from "lowcoder-design";
import remarkGfm from 'remark-gfm';
import { contrastColor } from "comps/controls/styleControlConstants";

const { Title, Text } = Typography;
const { TextArea } = Input;

const FieldWrapper = styled.div`
  margin-bottom: 32px;
  width: 100%;
  margin-top: 40px;
`;

const Wrapper = styled.div`
  padding: 32px 24px;
  max-width: 1000px;
  margin: 0;
`;

const BackButton = styled(Button)`
  margin-bottom: 24px;
`;

const DescriptionWrapper = styled.div`
  padding: 0;
  margin-top: 16px;
  max-width: 100%;
  word-wrap: break-word;
`;

const PanelWrapper = styled.div<{ bgColor: string }>`
  background-color: ${(props) => props.bgColor || '#f9f9f9'};
  padding: 16px;
  border-radius: 8px;
  margin-top: 16px;
`;

const StyledImage = styled.div`
  border: 1px solid #d9d9d9;
  padding: 10px;
  border-radius: 8px;
  max-width: 70%;
  text-align: center;
  margin-bottom: 16px;

  img {
    max-width: 100%;
    border-radius: 4px;
  }
`;

const AttachmentWrapper = styled.div`
  margin-bottom: 16px;
`;

// Function to convert Jira syntax to Markdown
const convertJiraToMarkdown = (content: string) => {
  // Normalize tabs to single spaces and reduce multiple spaces to a single space
  content = content.replace(/\t+/g, ' ').replace(/ +/g, ' ');

  // Convert Jira-style tables (||...||) to Markdown-style tables by replacing || with |
  content = content.replace(/\|\|/g, '|');

  // Split content into lines for processing
  const lines = content.split('\n');

  let inTable = false;

  const processedLines = lines.map((line) => {
    // Check if we are inside a table
    if (line.trim().startsWith('|')) {
      // If this is the header row, count the columns and generate the dashes line
      if (!inTable) {
        inTable = true; // We're now in a table
        const columns = line.split('|').filter(Boolean).length;

        // Create the markdown dashes row for headers
        const dashes = '| ' + new Array(columns).fill('---').join(' | ') + ' |';
        return line + '\n' + dashes; // Return the header with the dashes row
      } else {
        // If already in a table, just return the row as it is
        return line;
      }
    } else {
      inTable = false; // We're out of the table now
    }

    return line;
  });

  // Join lines back together
  content = processedLines.join('\n');

  // Handle Panels
  content = content.replace(/{panel:bgColor=([\#\w]+)}([\s\S]*?){panel}/g, (match, bgColor, text) => {
    return `<div style="background-color: ${bgColor}; padding: 8px; border-radius: 4px; margin-top: 16px;">${text.trim()}</div>`;
  });

  // Handle Bullet points and other Jira-specific syntax
  content = content.replace(/^\*\s+/gm, '- ');

  return content;
};

// Helper to render the description markdown
const renderMarkdown = (content: string) => {
  const convertedContent = convertJiraToMarkdown(content);
  return (
    <TacoMarkDown
      remarkPlugins={[remarkGfm]}
      children={convertedContent}
    />
  );
};

// Helper to render the attachment
const renderAttachment = (attachment: any) => {
  const mimeType = attachment.mimeType;
  const isImage = mimeType.startsWith('image/');
  const isVideo = mimeType.startsWith('video/');
  const isPdf = mimeType === 'application/pdf';

  return (
    <AttachmentWrapper>
      <List.Item.Meta
        title={attachment.filename}
        description={`
          ${(attachment.size / 1024).toFixed(2)} KB | 
          Created: ${new Date(attachment.created).toLocaleString()}
        `}
      />
      {isImage && (
        <StyledImage>
          <img src={attachment.content} alt={attachment.filename} />
        </StyledImage>
      )}
      {isVideo && (
        <StyledImage>
          <video controls>
            <source src={attachment.content} type={mimeType} />
            Your browser does not support the video tag.
          </video>
        </StyledImage>
      )}
      {isPdf && (
        <StyledImage>
          <embed src={attachment.content} type="application/pdf" width="100%" height="600px" />
        </StyledImage>
      )}
    </AttachmentWrapper>
  );
};

// Helper to calculate overall progress for subtasks
const calculateProgress = (subtasks: any[]) => {
  if (!subtasks.length) return 0; // If no subtasks, progress is 0

  const completedTasks = subtasks.filter(subtask => subtask.fields.status.name.toLowerCase() === 'done').length;
  const totalSubtasks = subtasks.length;

  return (completedTasks / totalSubtasks) * 100; // Calculate percentage
};

export function SupportDetail() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // State for description edit
  const [isEditingDescription, setIsEditingDescription] = useState<boolean>(false);
  const [newDescription, setNewDescription] = useState<string>('');

  // State for adding a comment
  const [newComment, setNewComment] = useState<string>('');

  // State for attachments
  const [attachmentFile, setAttachmentFile] = useState<any>(null);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const ticketData = await getTicket(ticketId);
        if (ticketData && ticketData.length === 1) {
          setTicket(ticketData[0]);
          setNewDescription(ticketData[0].fields.description || '');
        } else {
          setError("Ticket not found.");
        }
      } catch (err) {
        setError("Failed to load the ticket.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [ticketId]);

  const handleBack = () => {
    history.push(SUPPORT_URL);
  };

  // Handle description update
  const handleSaveDescription = async () => {
    try {
      await updateTicketDescription(ticketId, newDescription); // Placeholder API function
      message.success('Description updated successfully!');
      setIsEditingDescription(false);
    } catch (error) {
      console.error(error);
      message.error('Failed to update the description.');
    }
  };

  // Handle adding a comment
  const handleAddComment = async () => {
    if (newComment.trim()) {
      try {
        await addComment(ticketId, newComment); // Placeholder API function
        message.success('Comment added successfully!');
        setNewComment(''); // Clear input after submission
      } catch (error) {
        console.error(error);
        message.error('Failed to add the comment.');
      }
    } else {
      message.warning('Please write a comment before submitting.');
    }
  };

  // Handle attachment upload
  const handleUpload = async () => {
    if (attachmentFile) {
      try {
        await uploadAttachment(ticketId, attachmentFile); // Placeholder API function
        message.success('Attachment uploaded successfully!');
        setAttachmentFile(null); // Clear input after upload
      } catch (error) {
        console.error(error);
        message.error('Failed to upload the attachment.');
      }
    } else {
      message.warning('Please select a file to upload.');
    }
  };

  if (loading) {
    return (
      <Wrapper>
        <Skeleton />
      </Wrapper>
    );
  }

  if (error) {
    return (
      <Wrapper>
        <div>Error: {error}</div>
        <BackButton onClick={handleBack}>{trans("support.goBack")}</BackButton>
      </Wrapper>
    );
  }

  const overallProgress = calculateProgress(ticket.fields.subtasks);

  return (
    <Level1SettingPageContent>
      <Level1SettingPageTitle>
        <HeaderBack>
          <span onClick={() => history.push(SUPPORT_URL)}>{trans("settings.subscription")}</span>
          <ArrowIcon />
          <span>{ticket.fields.summary}</span>
        </HeaderBack>
      </Level1SettingPageTitle>

      <Wrapper>
        <Title level={2}>{ticket.fields.summary}</Title>

        <Descriptions bordered column={1} layout="horizontal" size="middle">
          <Descriptions.Item label={trans("support.status")}>
            <Tag color={ticket.fields.status.statusCategory.colorName} style={{color: contrastColor(ticket.fields.status.statusCategory.colorName), borderColor : contrastColor(ticket.fields.status.statusCategory.colorName)}}>{ticket.fields.status.name}</Tag>
          </Descriptions.Item>

          <Descriptions.Item label={trans("support.priority")}>
            <Tag color="blue">
              <img src={ticket.fields.priority.iconUrl} alt="priority-icon" style={{ width: 16, height: 16, marginRight: 8 }} />
              {ticket.fields.priority.name}
            </Tag>
          </Descriptions.Item>

          <Descriptions.Item label={trans("support.assignee")}>
            <Avatar src={ticket.fields.assignee.avatarUrls['48x48']} alt={ticket.fields.assignee.displayName} />
            <Text style={{ marginLeft: 8 }}>{ticket.fields.assignee.displayName}</Text>
            <Text type="secondary" style={{ marginLeft: 8 }}>({ticket.fields.assignee.timeZone})</Text>
          </Descriptions.Item>

          <Descriptions.Item label={trans("support.createdDate")}>
            {new Date(ticket.fields.created).toLocaleString()}
          </Descriptions.Item>

          <Descriptions.Item label={trans("support.updatedDate")}>
            {new Date(ticket.fields.updated).toLocaleString()}
          </Descriptions.Item>
        </Descriptions>

        <Title level={4} style={{ marginTop: '24px' }}>{trans("support.description")}</Title>
        <DescriptionWrapper>
          {isEditingDescription ? (
            <>
              <TextArea
                rows={4}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
              <Button type="primary" onClick={handleSaveDescription} style={{ marginTop: '8px' }}>
                {trans('support.save')}
              </Button>
              <Button onClick={() => setIsEditingDescription(false)} style={{ marginLeft: '8px' }}>
                {trans('support.cancel')}
              </Button>
            </>
          ) : (
            <>
              {renderMarkdown(newDescription || trans("support.noDescription"))}
              <Button onClick={() => setIsEditingDescription(true)} style={{ marginTop: '8px' }}>
                {trans('support.edit')}
              </Button>
            </>
          )}
        </DescriptionWrapper>

        {/* Overall Progress */}
        {ticket.fields.subtasks.length > 0 && (
          <FieldWrapper>
            <Title level={4}>{trans("support.subtasksProgress")}</Title>
            <Progress percent={overallProgress} />
          </FieldWrapper>
        )}

        {/* Subtasks */}
        {ticket.fields.subtasks.length > 0 && (
          <FieldWrapper>
            <Title level={4}>{trans("support.subtasks")}</Title>
            <List
              itemLayout="horizontal"
              dataSource={ticket.fields.subtasks}
              renderItem={(subtask: any) => (
                <List.Item>
                  <List.Item.Meta
                    title={<><p>{subtask.key}, {subtask.fields.summary}</p></>}
                    description={
                      <>
                        <Tag color={subtask.fields.status.statusCategory.colorName} style={{color: contrastColor(subtask.fields.status.statusCategory.colorName), borderColor : contrastColor(subtask.fields.status.statusCategory.colorName) }}>{subtask.fields.status.name}</Tag>
                      </>
                    }
                  />
                </List.Item>
              )}
            />
          </FieldWrapper>
        )}

        {/* Attachments */}
        {ticket.fields.attachment.length > 0 && (
          <FieldWrapper>
            <Title level={4}>{trans("support.attachments")}</Title>
            <List
              itemLayout="horizontal"
              dataSource={ticket.fields.attachment}
              renderItem={(attachment: any) => renderAttachment(attachment)}
            />
          </FieldWrapper>
        )}

        {/* Comments */}
        {ticket.fields.comment.total > 0 && (
          <FieldWrapper>
            <Title level={4}>{trans("support.comments")}</Title>
            <List
              itemLayout="horizontal"
              dataSource={ticket.fields.comment.comments}
              renderItem={(comment: any) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar src={comment.author.avatarUrls['48x48']} />}
                    title={comment.author.displayName}
                    description={
                      <>
                        <div>
                          <Text type="secondary">
                            Created: {new Date(comment.created).toLocaleString()}
                          </Text>
                        </div>
                        {renderMarkdown(comment.body)}
                        {comment.attachments && comment.attachments.length > 0 && 
                          comment.attachments.map((attachment: any) => renderAttachment(attachment))}
                      </>
                    }
                  />
                </List.Item>
              )}
            />
          </FieldWrapper>
        )}

        {/* Add a Comment */}
        <FieldWrapper>
          <Title level={4}>{trans("support.addComment")}</Title>
          <TextArea
            rows={3}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={trans("support.writeComment")}
          />
          <Button type="primary" onClick={handleAddComment} style={{ marginTop: '8px' }}>
            {trans("support.submitComment")}
          </Button>
        </FieldWrapper>

        {/* Upload an Attachment */}
        <FieldWrapper>
          <Title level={4}>{trans("support.addAttachment")}</Title>
          <Upload
            beforeUpload={(file) => {
              setAttachmentFile(file);
              return false; // prevent automatic upload
            }}
          >
            <Button icon={<UploadOutlined />}>{trans("support.selectFile")}</Button>
          </Upload>
          <Button type="primary" onClick={handleUpload} style={{ marginTop: '8px' }}>
            {trans("support.upload")}
          </Button>
        </FieldWrapper>
      </Wrapper>
    </Level1SettingPageContent>
  );
}

export default SupportDetail;
