import { SelectorIcon } from "@heroicons/react/outline";
import { CollectionIcon } from "@heroicons/react/solid";
import {
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  CogIcon,
  ExternalLinkIcon,
  LinkIcon,
  LogoutIcon,
  MapIcon,
  MoonIcon,
  ViewGridIcon,
  QuestionMarkCircleIcon,
  LightningBoltIcon,
} from "@heroicons/react/solid";
import { UserPlan } from "@prisma/client";
import { SessionContextValue, signOut, useSession } from "next-auth/react";
import { getCsrfToken, signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { Fragment, ReactNode, useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";

import { useIsEmbed } from "@calcom/embed-core/embed-iframe";
import { WEBAPP_URL, JOIN_SLACK, ROADMAP } from "@calcom/lib/constants";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import Button from "@calcom/ui/Button";
import Dropdown, {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@calcom/ui/Dropdown";
import LicenseBanner from "@ee/components/LicenseBanner";
import TrialBanner from "@ee/components/TrialBanner";
import HelpMenuItem from "@ee/components/support/HelpMenuItem";

import ErrorBoundary from "@lib/ErrorBoundary";
import classNames from "@lib/classNames";
import { shouldShowOnboarding } from "@lib/getting-started";
import useMeQuery from "@lib/hooks/useMeQuery";
import { trpc } from "@lib/trpc";

import CustomBranding from "@components/CustomBranding";
import { KBarRoot, KBarContent, KBarTrigger } from "@components/Kbar";
import Loader from "@components/Loader";
import { HeadSeo } from "@components/seo/head-seo";
import Badge from "@components/ui/Badge";
import ImpersonatingBanner from "@components/ui/ImpersonatingBanner";

import pkg from "../package.json";
import { useViewerI18n } from "./I18nLanguageHandler";
import Logo from "./Logo";

const jsonwebtoken = require("jsonwebtoken");

function useRedirectToLoginIfUnauthenticated(isPublic = false) {
  const { data: session, status } = useSession();
  const loading = status === "loading";
  const router = useRouter();
  useEffect(() => {
    //get token parameter from window location url
    if (isPublic) {
      return;
    }
    const callbackUrl = `${WEBAPP_URL}${location.pathname}${location.search}`;

    const token = window.location.search.split("token=")[1];

    if (!loading && token) {
      const user = jsonwebtoken.decode(token);
      if (session && session.user.id == user.id) {
        console.log("################## User Found:", user);
        return;
      }
      console.log("################## Logging in");
      signIn<"credentials">("token", { token, callbackUrl: callbackUrl, redirect: false });
      console.log("################## Logged in");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, session, isPublic]);


  return {
    loading: loading && !session,
    session,
  };
}

function useRedirectToOnboardingIfNeeded() {
  const router = useRouter();
  const query = useMeQuery();
  const user = query.data;

  const isRedirectingToOnboarding = user && shouldShowOnboarding(user);

  useEffect(() => {
    if (isRedirectingToOnboarding) {
      router.replace({
        pathname: "/getting-started",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRedirectingToOnboarding]);
  return {
    isRedirectingToOnboarding,
  };
}

export function ShellSubHeading(props: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={classNames("mb-3 block justify-between sm:flex", props.className)}>
      <div>
        <h2 className="flex content-center items-center space-x-2 text-base font-bold leading-6 text-gray-900 rtl:space-x-reverse">
          {props.title}
        </h2>
        {props.subtitle && <p className="text-sm text-neutral-500 ltr:mr-4">{props.subtitle}</p>}
      </div>
      {props.actions && <div className="flex-shrink-0">{props.actions}</div>}
    </div>
  );
}

const Layout = ({
  status,
  plan,
  ...props
}: LayoutProps & { status: SessionContextValue["status"]; plan?: UserPlan; isLoading: boolean }) => {
  const isEmbed = useIsEmbed();
  const router = useRouter();
  const { data: routingForms } = trpc.useQuery([
    "viewer.appById",
    {
      appId: "routing_forms",
    },
  ]);

  const { t } = useLocale();
  const navigation = [
    {
      name: t("event_types_page_title"),
      href: "/event-types",
      icon: LinkIcon,
      current: router.asPath.startsWith("/event-types"),
    },
    {
      name: t("bookings"),
      href: "/bookings/upcoming",
      icon: CalendarIcon,
      current: router.asPath.startsWith("/bookings"),
    },
    {
      name: t("availability"),
      href: "/availability",
      icon: ClockIcon,
      current: router.asPath.startsWith("/availability"),
    },
    routingForms
      ? {
          name: "Routing Forms",
          href: "/apps/routing_forms/forms",
          icon: CollectionIcon,
          current: router.asPath.startsWith("/apps/routing_forms/"),
        }
      : null,
    {
      name: t("workflows"),
      href: "/workflows",
      icon: LightningBoltIcon,
      current: router.asPath.startsWith("/workflows"),
      pro: true,
    },
    {
      name: t("apps"),
      href: "/apps",
      icon: ViewGridIcon,
      current: router.asPath.startsWith("/apps") && !router.asPath.startsWith("/apps/routing_forms/"),
      child: [
        {
          name: t("app_store"),
          href: "/apps",
          current: router.asPath === "/apps",
        },
        {
          name: t("installed_apps"),
          href: "/apps/installed",
          current: router.asPath === "/apps/installed",
        },
      ],
    },
    {
      name: t("settings"),
      href: "/settings/profile",
      icon: CogIcon,
      current: router.asPath.startsWith("/settings"),
    },
  ];
  const pageTitle = typeof props.heading === "string" ? props.heading : props.title;

  return (
    <>
      <HeadSeo
        title={pageTitle ?? "Cal.com"}
        description={props.subtitle ? props.subtitle?.toString() : ""}
        nextSeoProps={{
          nofollow: true,
          noindex: true,
        }}
      />
      <div>
        <Toaster position="bottom-right" />
      </div>

      <div
        className={classNames("flex overflow-hidden", props.large ? "bg-white" : "bg-gray-100")}
        data-testid="dashboard-shell">
        <div className="flex w-0 flex-1 flex-col overflow-hidden">
          <main
            className={classNames(
              "relative z-0 flex-1 overflow-y-auto focus:outline-none",
              status === "authenticated" && "max-w-[1700px]",
              props.flexChildrenContainer && "flex flex-col"
            )}>
            {/* show top navigation for md and smaller (tablet and phones) */}
            
            <div
              className={classNames(
                props.centered && "mx-auto md:max-w-5xl",
                props.flexChildrenContainer && "flex flex-1 flex-col",
              )}>
              <ImpersonatingBanner />
              {!!props.backPath && (
                <div className="mx-3 mb-8 sm:mx-8">
                  <Button
                    onClick={() => router.push(props.backPath as string)}
                    StartIcon={ArrowLeftIcon}
                    color="secondary">
                    Back
                  </Button>
                </div>
              )}
              {props.heading && (
                <div
                  className={classNames(
                    props.large && "bg-gray-100 py-8 lg:mb-8 lg:pt-16 lg:pb-7",
                    "block justify-between px-4 sm:flex sm:px-6 md:px-8"
                  )}>
                  {props.HeadingLeftIcon && <div className="ltr:mr-4">{props.HeadingLeftIcon}</div>}
                  <div className="mb-8 w-full">
                    {props.isLoading ? (
                      <>
                        <div className="mb-1 h-6 w-24 animate-pulse rounded-md bg-gray-200" />
                        <div className="mb-1 h-6 w-32 animate-pulse rounded-md bg-gray-200" />
                      </>
                    ) : (
                      <>
                        <h1 className="font-cal mb-1 text-xl font-bold capitalize tracking-wide text-gray-900">
                          {props.heading}
                        </h1>
                        <p className="text-sm text-neutral-500 ltr:mr-4 rtl:ml-4">{props.subtitle}</p>
                      </>
                    )}
                  </div>
                  {props.CTA && <div className="mb-4 flex-shrink-0">{props.CTA}</div>}
                </div>
              )}
              <div
                className={classNames(
                  "",
                  props.flexChildrenContainer && "flex flex-1 flex-col"
                )}>
                <ErrorBoundary>{!props.isLoading ? props.children : props.customLoader}</ErrorBoundary>
              </div>
              {/* show bottom navigation for md and smaller (tablet and phones) */}
            </div>
            <LicenseBanner />
          </main>
        </div>
      </div>
    </>
  );
};

const MemoizedLayout = React.memo(Layout);

type LayoutProps = {
  centered?: boolean;
  title?: string;
  heading?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  CTA?: ReactNode;
  large?: boolean;
  HeadingLeftIcon?: ReactNode;
  backPath?: string; // renders back button to specified path
  // use when content needs to expand with flex
  flexChildrenContainer?: boolean;
  isPublic?: boolean;
  customLoader?: ReactNode;
};

export default function Shell(props: LayoutProps) {
  const { loading, session } = useRedirectToLoginIfUnauthenticated(props.isPublic);
  const { isRedirectingToOnboarding } = useRedirectToOnboardingIfNeeded();

  const query = useMeQuery();
  const user = query.data;

  const i18n = useViewerI18n();
  const { status } = useSession();

  const isLoading = isRedirectingToOnboarding || loading;

  // Don't show any content till translations are loaded.
  // As they are cached infintely, this status would be loading just once for the app's lifetime until refresh
  if (i18n.status === "loading") {
    return (
      <div className="absolute z-50 flex w-full items-center bg-gray-50">
        <Loader />
      </div>
    );
  }

  if (!session && !props.isPublic) return null;
  return (
    <KBarRoot>
      <CustomBranding lightVal={user?.brandColor} darkVal={user?.darkBrandColor} />
      <MemoizedLayout plan={user?.plan} status={status} {...props} isLoading={isLoading} />
      <KBarContent />
    </KBarRoot>
  );
}

function UserDropdown({ small }: { small?: boolean }) {
  const { t } = useLocale();
  const query = useMeQuery();
  const user = query.data;

  const mutation = trpc.useMutation("viewer.away", {
    onSettled() {
      utils.invalidateQueries("viewer.me");
    },
  });
  const utils = trpc.useContext();
  const [helpOpen, setHelpOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  if (!user) {
    return null;
  }
  const onHelpItemSelect = () => {
    setHelpOpen(false);
    setMenuOpen(false);
  };

  // Prevent rendering dropdown if user isn't available.
  // We don't want to show nameless user.
  if (!user) {
    return null;
  }
  return (
    <Dropdown open={menuOpen} onOpenChange={() => setHelpOpen(false)}>
      <DropdownMenuTrigger asChild onClick={() => setMenuOpen(true)}>
        <button className="group flex w-full cursor-pointer appearance-none items-center text-left">
          <span
            className={classNames(
              small ? "h-8 w-8" : "h-10 w-10",
              "relative flex-shrink-0 rounded-full bg-gray-300  ltr:mr-3 rtl:ml-3"
            )}>
            {
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="rounded-full"
                src={WEBAPP_URL + "/" + user.username + "/avatar.png"}
                alt={user.username || "Nameless User"}
              />
            }
            {!user.away && (
              <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
            )}
            {user.away && (
              <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-yellow-500" />
            )}
          </span>
          {!small && (
            <span className="flex flex-grow items-center truncate">
              <span className="flex-grow truncate text-sm">
                <span className="block truncate font-medium text-gray-900">
                  {user.name || "Nameless User"}
                </span>
                <span className="block truncate font-normal text-neutral-500">
                  {user.username
                    ? process.env.NEXT_PUBLIC_WEBSITE_URL === "https://cal.com"
                      ? `cal.com/${user.username}`
                      : `/${user.username}`
                    : "No public page"}
                </span>
              </span>
              <SelectorIcon
                className="h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500"
                aria-hidden="true"
              />
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent portalled={true} onInteractOutside={() => setMenuOpen(false)}>
        {helpOpen ? (
          <HelpMenuItem onHelpItemSelect={() => onHelpItemSelect()} />
        ) : (
          <>
            <DropdownMenuItem>
              <a
                onClick={() => {
                  mutation.mutate({ away: user?.away });
                  utils.invalidateQueries("viewer.me");
                }}
                className="flex min-w-max cursor-pointer px-4 py-2 text-sm hover:bg-gray-100 hover:text-gray-900">
                <MoonIcon
                  className={classNames(
                    user.away
                      ? "text-purple-500 group-hover:text-purple-700"
                      : "text-gray-500 group-hover:text-gray-700",
                    "h-5 w-5 flex-shrink-0 ltr:mr-3 rtl:ml-3"
                  )}
                  aria-hidden="true"
                />
                {user.away ? t("set_as_free") : t("set_as_away")}
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="h-px bg-gray-200" />
            {user.username && (
              <DropdownMenuItem>
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href={`${process.env.NEXT_PUBLIC_WEBSITE_URL}/${user.username}`}
                  className="flex items-center px-4 py-2 text-sm text-gray-700">
                  <ExternalLinkIcon className="h-5 w-5 text-gray-500 ltr:mr-3 rtl:ml-3" />{" "}
                  {t("view_public_page")}
                </a>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator className="h-px bg-gray-200" />
            <DropdownMenuItem>
              <a
                href={JOIN_SLACK}
                target="_blank"
                rel="noreferrer"
                className="flex px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                <svg
                  viewBox="0 0 2447.6 2452.5"
                  className={classNames(
                    "text-gray-500 group-hover:text-gray-700",
                    "mt-0.5 h-4 w-4 flex-shrink-0 ltr:mr-4 rtl:ml-4"
                  )}
                  xmlns="http://www.w3.org/2000/svg">
                  <g clipRule="evenodd" fillRule="evenodd">
                    <path
                      d="m897.4 0c-135.3.1-244.8 109.9-244.7 245.2-.1 135.3 109.5 245.1 244.8 245.2h244.8v-245.1c.1-135.3-109.5-245.1-244.9-245.3.1 0 .1 0 0 0m0 654h-652.6c-135.3.1-244.9 109.9-244.8 245.2-.2 135.3 109.4 245.1 244.7 245.3h652.7c135.3-.1 244.9-109.9 244.8-245.2.1-135.4-109.5-245.2-244.8-245.3z"
                      fill="currentColor"
                    />
                    <path
                      d="m2447.6 899.2c.1-135.3-109.5-245.1-244.8-245.2-135.3.1-244.9 109.9-244.8 245.2v245.3h244.8c135.3-.1 244.9-109.9 244.8-245.3zm-652.7 0v-654c.1-135.2-109.4-245-244.7-245.2-135.3.1-244.9 109.9-244.8 245.2v654c-.2 135.3 109.4 245.1 244.7 245.3 135.3-.1 244.9-109.9 244.8-245.3z"
                      fill="currentColor"
                    />
                    <path
                      d="m1550.1 2452.5c135.3-.1 244.9-109.9 244.8-245.2.1-135.3-109.5-245.1-244.8-245.2h-244.8v245.2c-.1 135.2 109.5 245 244.8 245.2zm0-654.1h652.7c135.3-.1 244.9-109.9 244.8-245.2.2-135.3-109.4-245.1-244.7-245.3h-652.7c-135.3.1-244.9 109.9-244.8 245.2-.1 135.4 109.4 245.2 244.7 245.3z"
                      fill="currentColor"
                    />
                    <path
                      d="m0 1553.2c-.1 135.3 109.5 245.1 244.8 245.2 135.3-.1 244.9-109.9 244.8-245.2v-245.2h-244.8c-135.3.1-244.9 109.9-244.8 245.2zm652.7 0v654c-.2 135.3 109.4 245.1 244.7 245.3 135.3-.1 244.9-109.9 244.8-245.2v-653.9c.2-135.3-109.4-245.1-244.7-245.3-135.4 0-244.9 109.8-244.8 245.1 0 0 0 .1 0 0"
                      fill="currentColor"
                    />
                  </g>
                </svg>
                {t("join_our_slack")}
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <a
                target="_blank"
                rel="noopener noreferrer"
                href={ROADMAP}
                className="flex items-center px-4 py-2 text-sm text-gray-700">
                <MapIcon className="h-5 w-5 text-gray-500 ltr:mr-3 rtl:ml-3" /> {t("visit_roadmap")}
              </a>
            </DropdownMenuItem>

            <button
              className="flex w-full px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-gray-100 hover:text-gray-900"
              onClick={() => setHelpOpen(true)}>
              <QuestionMarkCircleIcon
                className={classNames(
                  "text-gray-500 group-hover:text-neutral-500",
                  "h-5 w-5 flex-shrink-0 ltr:mr-3"
                )}
                aria-hidden="true"
              />

              {t("help")}
            </button>

            <DropdownMenuSeparator className="h-px bg-gray-200" />
            <DropdownMenuItem>
              <a
                onClick={() => signOut({ callbackUrl: "/auth/logout" })}
                className="flex cursor-pointer px-4 py-2 text-sm hover:bg-gray-100 hover:text-gray-900">
                <LogoutIcon
                  className={classNames(
                    "text-gray-500 group-hover:text-gray-700",
                    "h-5 w-5 flex-shrink-0 ltr:mr-3 rtl:ml-3"
                  )}
                  aria-hidden="true"
                />
                {t("sign_out")}
              </a>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </Dropdown>
  );
}
