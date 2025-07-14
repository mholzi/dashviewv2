# Initiate Feature Request

## Interactive Feature Request Creation

Create a new feature request file following the INITIAL_EXAMPLE.md template. This command will guide you through the process of creating a comprehensive feature request that can be used with the generate-prp workflow.

## Process

### 1. Get File Name
Ask user for the name of the new feature request file (without .md extension).

### 2. Get Feature Description
Ask user to describe the feature they want to build. Be specific about:
- What functionality is needed
- What technologies should be used
- What the end goal is

### 3. Enhance and Draft
Based on the user's description and knowledge of the codebase:
- Analyze the feature requirements
- Research relevant examples in the codebase
- Identify applicable documentation
- Consider implementation approaches
- Draft the complete INITIAL_*.md file

### 4. Create File
Save the enhanced feature request as `/Users/markusholzhaeuser/dashviewv2/feature_requests/INITIAL_{name}.md`

### 5. Provide Summary
Echo key highlights including:
- Feature overview
- Technologies involved
- Key examples referenced
- Important considerations
- Next steps

### 6. Follow-up Questions
Ask clarifying questions to refine the feature request:
- Missing requirements
- Specific preferences
- Integration needs
- Performance requirements
- Testing approaches
Ask questions 1 by 1 with details about pros and cons of options at hand. 
## Template Structure to Follow

```markdown
## FEATURE:
[Enhanced feature description based on user input and analysis]

## EXAMPLES:
[Relevant examples from the codebase that should be referenced]

## DOCUMENTATION:
[Relevant documentation URLs and resources]

## OTHER CONSIDERATIONS:
[Implementation gotchas, requirements, and best practices]
```

## Success Criteria
- File created in correct location
- Follows INITIAL_EXAMPLE.md structure
- Enhanced with technical insights
- Includes relevant examples
- Provides clear implementation direction
- Ready for generate-prp command

## Next Steps
After completion, user should run:
```bash
/generate-prp feature_requests/INITIAL_{name}.md
```

This will create a comprehensive PRP in the PRPs/ folder for implementation.