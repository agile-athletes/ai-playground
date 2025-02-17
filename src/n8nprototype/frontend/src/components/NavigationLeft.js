import './NavigationLeft.css';
import WorkflowButton from './WorkflowButton';

// Filter out all attentions with type 'workflow'
const getWorkflowAttentions = (jsonWithAttentions) => {
    if (!jsonWithAttentions || !jsonWithAttentions.attentions) return [];
    return jsonWithAttentions.attentions.filter(
        (attention) => attention.value && attention.value.type === 'workflow'
    );
};

// Returns true if the given attention has the highest weight among all workflow attentions
const isHighestWorkflowAttention = (attention, workflowAttentions) => {
    if (workflowAttentions.length === 0) return false;
    const maxWeight = Math.max(...workflowAttentions.map((att) => parseFloat(att.weight)));
    return parseFloat(attention.weight) === maxWeight;
};

const NavigationLeft = ({jsonWithAttentions}) => {
    const workflowAttentions = getWorkflowAttentions(jsonWithAttentions);

    return (
        <nav className="navigation-left">
            <ul>
                {workflowAttentions.map((attention) => (
                    <li key={attention.id}>
                        <WorkflowButton
                            attention={attention}
                            isHighest={isHighestWorkflowAttention(attention, workflowAttentions)}
                        />
                    </li>
                ))}
            </ul>
        </nav>
    );
};

export default NavigationLeft;
