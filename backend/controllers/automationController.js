const AutomationRule = require('../models/AutomationRule');
const { AppError } = require('../middleware/errorHandler');

const VALID_TRIGGERS = ['status_change', 'task_assigned'];
const VALID_ACTIONS = ['send_notification', 'change_status', 'assign_user'];

// ============================================
// CREATE RULE
// POST /api/projects/:projectId/automations
// ============================================
exports.createRule = async (req, res, next) => {
  try {
    const { name, trigger, actions } = req.body;

    if (!name || !name.trim()) {
      return next(new AppError('Rule name is required', 400));
    }
    if (!trigger || !VALID_TRIGGERS.includes(trigger.type)) {
      return next(new AppError('Invalid trigger type', 400));
    }
    if (!Array.isArray(actions) || actions.length === 0) {
      return next(new AppError('At least one action is required', 400));
    }
    const invalidAction = actions.find((a) => !VALID_ACTIONS.includes(a.type));
    if (invalidAction) {
      return next(new AppError(`Invalid action type: ${invalidAction.type}`, 400));
    }

    const rule = await AutomationRule.create({
      projectId: req.project._id,
      name: name.trim(),
      trigger,
      actions,
      createdBy: req.user._id
    });

    res.status(201).json({ success: true, message: 'Automation rule created', rule });
  } catch (error) {
    next(error);
  }
};

// ============================================
// LIST RULES FOR A PROJECT
// GET /api/projects/:projectId/automations
// ============================================
exports.getProjectRules = async (req, res, next) => {
  try {
    const rules = await AutomationRule.find({ projectId: req.project._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: rules.length, rules });
  } catch (error) {
    next(error);
  }
};

// ============================================
// TOGGLE ACTIVE/INACTIVE
// PATCH /api/projects/:projectId/automations/:ruleId/toggle
// ============================================
exports.toggleRule = async (req, res, next) => {
  try {
    const rule = await AutomationRule.findOne({ _id: req.params.ruleId, projectId: req.project._id });
    if (!rule) return next(new AppError('Rule not found', 404));

    rule.isActive = !rule.isActive;
    await rule.save();

    res.status(200).json({
      success: true,
      message: `Rule ${rule.isActive ? 'activated' : 'deactivated'}`,
      rule
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// UPDATE RULE
// PATCH /api/projects/:projectId/automations/:ruleId
// ============================================
exports.updateRule = async (req, res, next) => {
  try {
    const rule = await AutomationRule.findOne({ _id: req.params.ruleId, projectId: req.project._id });
    if (!rule) return next(new AppError('Rule not found', 404));

    const { name, trigger, actions } = req.body;
    if (name !== undefined) rule.name = name.trim();
    if (trigger !== undefined) rule.trigger = trigger;
    if (actions !== undefined) rule.actions = actions;

    await rule.save();

    res.status(200).json({ success: true, message: 'Rule updated', rule });
  } catch (error) {
    next(error);
  }
};

// ============================================
// DELETE RULE
// DELETE /api/projects/:projectId/automations/:ruleId
// ============================================
exports.deleteRule = async (req, res, next) => {
  try {
    const rule = await AutomationRule.findOneAndDelete({ _id: req.params.ruleId, projectId: req.project._id });
    if (!rule) return next(new AppError('Rule not found', 404));

    res.status(200).json({ success: true, message: 'Rule deleted' });
  } catch (error) {
    next(error);
  }
};
