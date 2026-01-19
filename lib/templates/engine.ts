import type { Template, TemplateVariable } from '@/types';

export interface CompiledTemplate {
  body: string;
  systemAdditions?: string;
  variables: Record<string, any>;
  metadata: {
    templateId: string;
    templateName: string;
    compiledAt: string;
  };
}

export class TemplateEngine {
  /**
   * Compile a template with provided variable values
   */
  static compile(
    template: Template,
    variables: Record<string, any>
  ): CompiledTemplate {
    // Validate required variables
    this.validateVariables(template.variables, variables);

    // Replace variables in template body
    let compiledBody = this.interpolate(template.body, variables);

    // Replace variables in system additions if present
    let compiledSystemAdditions: string | undefined;
    if (template.systemAdditions) {
      compiledSystemAdditions = this.interpolate(template.systemAdditions, variables);
    }

    return {
      body: compiledBody,
      systemAdditions: compiledSystemAdditions,
      variables,
      metadata: {
        templateId: template.id,
        templateName: template.name,
        compiledAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Interpolate variables into a string
   * Supports: {{variable}}, {{variable|default}}, {{variable:transform}}
   */
  private static interpolate(
    text: string,
    variables: Record<string, any>
  ): string {
    return text.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const trimmedKey = key.trim();
      
      // Handle default values: {{variable|default}}
      if (trimmedKey.includes('|')) {
        const [varName, defaultValue] = trimmedKey.split('|').map(s => s.trim());
        return String(variables[varName] ?? defaultValue);
      }

      // Handle transforms: {{variable:uppercase}}
      if (trimmedKey.includes(':')) {
        const [varName, transform] = trimmedKey.split(':').map(s => s.trim());
        const value = variables[varName];
        return this.applyTransform(value, transform);
      }

      // Simple variable replacement
      const value = variables[trimmedKey];
      return value !== undefined ? String(value) : match;
    });
  }

  /**
   * Apply transformation to a value
   */
  private static applyTransform(value: any, transform: string): string {
    if (value === undefined || value === null) return '';

    const stringValue = String(value);

    switch (transform.toLowerCase()) {
      case 'uppercase':
      case 'upper':
        return stringValue.toUpperCase();
      case 'lowercase':
      case 'lower':
        return stringValue.toLowerCase();
      case 'capitalize':
        return stringValue.charAt(0).toUpperCase() + stringValue.slice(1);
      case 'trim':
        return stringValue.trim();
      default:
        return stringValue;
    }
  }

  /**
   * Validate that all required variables are provided
   */
  private static validateVariables(
    templateVars: TemplateVariable[],
    providedVars: Record<string, any>
  ): void {
    const missing: string[] = [];

    for (const templateVar of templateVars) {
      if (templateVar.required && !(templateVar.name in providedVars)) {
        missing.push(templateVar.name);
      }
    }

    if (missing.length > 0) {
      throw new Error(`Missing required variables: ${missing.join(', ')}`);
    }
  }

  /**
   * Extract variable names from template text
   */
  static extractVariables(text: string): string[] {
    const variables = new Set<string>();
    const regex = /\{\{([^}]+)\}\}/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const key = match[1].trim();
      // Remove default values and transforms
      const varName = key.split(/[|:]/)[0].trim();
      variables.add(varName);
    }

    return Array.from(variables);
  }

  /**
   * Generate a form schema for template variables
   */
  static generateFormSchema(template: Template): any {
    return {
      title: template.name,
      description: template.description,
      fields: template.variables.map(variable => ({
        name: variable.name,
        label: variable.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        type: variable.type,
        description: variable.description,
        required: variable.required,
        defaultValue: variable.defaultValue,
      })),
    };
  }

  /**
   * Validate variable values against their types
   */
  static validateVariableTypes(
    templateVars: TemplateVariable[],
    providedVars: Record<string, any>
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const templateVar of templateVars) {
      const value = providedVars[templateVar.name];

      if (value === undefined) continue;

      switch (templateVar.type) {
        case 'number':
          if (typeof value !== 'number' && isNaN(Number(value))) {
            errors.push(`${templateVar.name} must be a number`);
          }
          break;
        case 'boolean':
          if (typeof value !== 'boolean') {
            errors.push(`${templateVar.name} must be a boolean`);
          }
          break;
        case 'string':
        case 'text':
          if (typeof value !== 'string') {
            errors.push(`${templateVar.name} must be a string`);
          }
          break;
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get template preview with placeholder values
   */
  static preview(template: Template): string {
    const placeholderVars: Record<string, any> = {};

    for (const variable of template.variables) {
      placeholderVars[variable.name] = 
        variable.defaultValue || 
        `[${variable.name.toUpperCase()}]`;
    }

    return this.interpolate(template.body, placeholderVars);
  }
}
