import { useState } from 'react';
import { CampaignFormValues } from '@/lib/server/actions/meta/types';
import type {
  CampaignDraftPayload,
  ManualCampaignDraftForm,
} from '@/lib/shared/types/campaignDrafts';
import { Node, Edge } from '@xyflow/react';

/**
 * Response from campaign submission API
 */
interface CampaignSubmitResponse {
  success: boolean;
  error?: string;
  message?: string;
  jobId?: string;
  draftId?: string;
  href?: string;
  nodes?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  edges?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

/**
 * Return type for the useCampaignSubmit hook
 */
interface UseCampaignSubmitReturn {
  /** Submit the campaign to the API */
  submitCampaign: (values?: CampaignFormValues) => Promise<CampaignSubmitResponse>;
  /** Whether the campaign is currently being submitted */
  isSubmitting: boolean;
  /** Error message if submission failed */
  submitError: string | null;
  /** Whether submission was successful */
  submitSuccess: boolean;
  /** Reset submission state */
  resetSubmission: () => void;
  /** Job ID for tracking submission progress */
  jobId: string | null;
  /** Show progress modal */
  showProgressModal: boolean;
  /** Function to set the visibility of the progress modal */
  setShowProgressModal: (open: boolean) => void;
  /** Nodes for the progress graph */
  progressNodes: Node[];
  /** Edges for the progress graph */
  progressEdges: Edge[];

}

/**
 * Hook for handling campaign submission to API
 * 
 * Manages submission state, error handling, and success tracking
 * 
 * @returns Object with submission functions and state
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

function toDateKey(value: Date | string | null | undefined): string {
  if (!value) {
    return '';
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

function toManualDraftForm(form: CampaignFormValues): ManualCampaignDraftForm {
  const firstAdSet = form.adSets[0];
  const firstCreative = firstAdSet?.creatives?.[0];

  return {
    campaignName: form.campaign.campaignName,
    objective: form.campaign.objective,
    destinationType: form.campaign.destinationType,
    specialAdCategories: form.campaign.special_ad_categories ?? [],
    bidStrategy: form.campaign.bid_strategy,
    buyingType: form.campaign.buying_type,
    budgetAmount: Number(form.budget.amount) || 0,
    budgetType: form.budget.type === 'lifetime' ? 'lifetime' : 'daily',
    budgetOptimization: Boolean(form.budget.optimization),
    startDate: toDateKey(form.schedule.startDate),
    endDate: form.schedule.endDate ? toDateKey(form.schedule.endDate) : null,
    draftTarget: {
      mode:
        form.creationScope === 'ad'
          ? 'existing_adset'
          : form.creationScope === 'adset'
            ? 'existing_campaign'
            : 'new_campaign',
      existingCampaignId: form.parentCampaignExternalId,
      existingAdSetId: form.parentAdSetExternalId,
    },
    adSets: form.adSets.map((adSet, index) => ({
      id: `${index}`,
      role: index === 0 ? 'primary' : 'challenger',
      existingCampaignId: form.parentCampaignExternalId,
      existingAdSetId: form.parentAdSetExternalId,
      adSetName: adSet.adSetName,
      pageId: adSet.page_id,
      optimizationGoal: adSet.optimization_goal,
      useAdvantageAudience: adSet.useAdvantageAudience,
      useAdvantagePlacements: adSet.useAdvantagePlacements,
      billingEvent: adSet.billingEvent,
      targeting: {
        markerPosition: adSet.targeting.location.markerPosition,
        radius: Number(adSet.targeting.location.radius) || 10,
        ageMin: Number(adSet.targeting.age.min) || 18,
        ageMax: Number(adSet.targeting.age.max) || 65,
        genders: adSet.targeting.genders ?? [],
        interests: adSet.targeting.interests ?? [],
      },
      creatives: adSet.creatives.map((creative, creativeIndex) => ({
        id: `${index}-${creativeIndex}`,
        role: creativeIndex === 0 ? 'primary' : 'challenger',
        contentSource: creative.contentSource,
        existingCreativeIds: creative.existingCreativeIds ?? [],
        uploadedFileNames: (creative.uploadedFiles ?? []).map((file) => file.name),
        imageHash: creative.imageHash,
        adHeadline: creative.adHeadline,
        adPrimaryText: creative.adPrimaryText,
        adDescription: creative.adDescription,
        adCallToAction: creative.adCallToAction,
      })),
    })),
    adSetName: firstAdSet?.adSetName ?? '',
    pageId: firstAdSet?.page_id ?? '',
    optimizationGoal: firstAdSet?.optimization_goal ?? '',
    useAdvantageAudience: Boolean(firstAdSet?.useAdvantageAudience),
    useAdvantagePlacements: Boolean(firstAdSet?.useAdvantagePlacements),
    billingEvent: firstAdSet?.billingEvent ?? '',
    targeting: {
      markerPosition: firstAdSet?.targeting.location.markerPosition ?? null,
      radius: Number(firstAdSet?.targeting.location.radius) || 10,
      ageMin: Number(firstAdSet?.targeting.age.min) || 18,
      ageMax: Number(firstAdSet?.targeting.age.max) || 65,
      genders: firstAdSet?.targeting.genders ?? [],
      interests: firstAdSet?.targeting.interests ?? [],
    },
    creative: {
      contentSource: firstCreative?.contentSource ?? '',
      existingCreativeIds: firstCreative?.existingCreativeIds ?? [],
      imageHash: firstCreative?.imageHash ?? '',
      adHeadline: firstCreative?.adHeadline ?? '',
      adPrimaryText: firstCreative?.adPrimaryText ?? '',
      adDescription: firstCreative?.adDescription ?? '',
      adCallToAction: firstCreative?.adCallToAction ?? '',
    },
  };
}

export function useCampaignSubmit(): UseCampaignSubmitReturn {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressNodes, setProgressNodes] = useState<any[]>([]);
  const [progressEdges, setProgressEdges] = useState<any[]>([]);

  /**
   * Submit campaign data to API
   * 
   * @param form - Form values from useCampaignForm (optional if using test data)
   * @returns Response from API with success status and campaign ID
   */
  const submitCampaign = async (form?: CampaignFormValues): Promise<CampaignSubmitResponse> => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    setJobId(null);
    setShowProgressModal(false);

    if (!form) {
      const errorMessage = "No form data provided and no test campaign type selected";
      setSubmitError(errorMessage);
      setIsSubmitting(false);
      return {
        success: false,
        error: errorMessage
      };
    }

    const formData = form;

    try {
      const payloadJson: CampaignDraftPayload = {
        mode: 'manual',
        form: toManualDraftForm(formData),
      };

      const res = await fetch('/api/campaign-drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.campaign.campaignName || 'Untitled Meta campaign draft',
          reviewNotes:
            'Draft saved from the manual Meta builder. Live Meta publishing remains disabled until the provider mutation authorization model is implemented.',
          payloadJson,
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        const errorMessage = result.error || result.data?.error || 'Failed to save campaign draft';
        setSubmitError(errorMessage);
        return {
          success: false,
          error: errorMessage
        };
      }

      // Success
      setSubmitSuccess(true);
      setJobId(result.data?.draftId || null);
      setShowProgressModal(false);
      setProgressNodes([]);
      setProgressEdges([]);

      return {
        success: true,
        message: 'Campaign draft saved for review.',
        jobId: result.data?.draftId,
        draftId: result.data?.draftId,
        href: result.data?.href,
        nodes: [],
        edges: [],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setSubmitError(errorMessage);

      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Reset submission state
   */
  const resetSubmission = () => {
    setIsSubmitting(false);
    setSubmitError(null);
    setSubmitSuccess(false);
    setJobId(null);
  };

  return {
    submitCampaign,
    isSubmitting,
    submitError,
    submitSuccess,
    resetSubmission,
    jobId,
    showProgressModal,
    setShowProgressModal,
    progressNodes,
    progressEdges,
  };
}
