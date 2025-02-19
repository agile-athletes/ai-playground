import './NavigationLeft.css';
import WorkflowButton from './WorkflowButton';

// Filter out all attentions with type 'workflow'
const getWorkflowAttentions = (jsonWithAttentions) => {
    if (!jsonWithAttentions || !jsonWithAttentions.attentions) return [];
    return jsonWithAttentions.attentions.filter(
        (attention) => attention.value && attention.value.type === 'workflow'
    );
};

const NavigationLeft = ({jsonWithAttentions, setWebhookUrl}) => {
    const workflowAttentions = getWorkflowAttentions(jsonWithAttentions);

    return (
        <nav className="navigation-left">
            <ul>
                {workflowAttentions.map((attention) => (
                    <li key={attention.id}>
                        <WorkflowButton
                            attention={attention}
                            setWebhookUrl={setWebhookUrl}
                        />
                    </li>
                ))}
            </ul>
        </nav>
    );
};

export default NavigationLeft;
