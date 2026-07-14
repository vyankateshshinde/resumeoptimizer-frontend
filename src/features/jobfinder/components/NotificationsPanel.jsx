import {
  useCallback,
  useEffect,
  useState,
} from "react";
import toast from "react-hot-toast";
import {
  Bell,
  Check,
  CheckCheck,
  ExternalLink,
  Loader2,
  MapPin,
  RefreshCw,
} from "lucide-react";

import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
} from "../api/jobFinderApi";

const noop = () => {};

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  fallback;

const formatDate = (value) => {
  if (!value) {
    return "Date unavailable";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const NotificationsPanel = ({
  onUnreadCountChange = noop,
}) => {
  const [notifications, setNotifications] =
    useState([]);
  const [unreadCount, setUnreadCount] =
    useState(0);
  const [loading, setLoading] = useState(true);
  const [busyNotificationId, setBusyNotificationId] =
    useState(null);
  const [markingAll, setMarkingAll] =
    useState(false);

  const updateUnreadCount = useCallback(
    (count) => {
      const safeCount = Math.max(
        0,
        Number(count) || 0
      );

      setUnreadCount(safeCount);
      onUnreadCountChange(safeCount);
    },
    [onUnreadCountChange]
  );

  const loadNotifications = useCallback(
    async () => {
      try {
        setLoading(true);

        const [notificationData, count] =
          await Promise.all([
            getNotifications(),
            getUnreadNotificationCount(),
          ]);

        setNotifications(
          Array.isArray(notificationData)
            ? notificationData
            : []
        );

        updateUnreadCount(count);
      } catch (error) {
        console.error(error);

        toast.error(
          getErrorMessage(
            error,
            "Unable to load notifications"
          )
        );
      } finally {
        setLoading(false);
      }
    },
    [updateUnreadCount]
  );

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkRead = async (
    notification
  ) => {
    if (notification.read) {
      return;
    }

    try {
      setBusyNotificationId(notification.id);

      const updatedNotification =
        await markNotificationRead(
          notification.id
        );

      setNotifications((current) =>
        current.map((item) =>
          Number(item.id) ===
          Number(notification.id)
            ? updatedNotification
            : item
        )
      );

      updateUnreadCount(unreadCount - 1);

      toast.success(
        "Notification marked as read"
      );
    } catch (error) {
      console.error(error);

      toast.error(
        getErrorMessage(
          error,
          "Unable to mark notification as read"
        )
      );
    } finally {
      setBusyNotificationId(null);
    }
  };

  const handleMarkAllRead = async () => {
    const unreadNotifications =
      notifications.filter(
        (notification) => !notification.read
      );

    if (unreadNotifications.length === 0) {
      return;
    }

    try {
      setMarkingAll(true);

      await Promise.all(
        unreadNotifications.map(
          (notification) =>
            markNotificationRead(
              notification.id
            )
        )
      );

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          read: true,
        }))
      );

      updateUnreadCount(0);

      toast.success(
        "All notifications marked as read"
      );
    } catch (error) {
      console.error(error);

      toast.error(
        getErrorMessage(
          error,
          "Unable to mark all notifications as read"
        )
      );

      await loadNotifications();
    } finally {
      setMarkingAll(false);
    }
  };

  if (loading) {
    return (
      <section className="jf-notification-loading">
        <Loader2
          className="jf-spin"
          size={30}
        />

        <p>Loading notifications...</p>
      </section>
    );
  }

  return (
    <section className="jf-notification-page">
      <div className="jf-notification-heading">
        <div>
          <h2>Job Notifications</h2>

          <p>
            {unreadCount} unread{" "}
            {unreadCount === 1
              ? "notification"
              : "notifications"}
          </p>
        </div>

        <div className="jf-notification-heading-actions">
          <button
            type="button"
            className="jf-notification-refresh"
            onClick={loadNotifications}
          >
            <RefreshCw size={17} />
            Refresh
          </button>

          {unreadCount > 0 && (
            <button
              type="button"
              className="jf-mark-all-button"
              disabled={markingAll}
              onClick={handleMarkAllRead}
            >
              {markingAll ? (
                <Loader2
                  className="jf-spin"
                  size={17}
                />
              ) : (
                <CheckCheck size={17} />
              )}

              {markingAll
                ? "Updating..."
                : "Mark all read"}
            </button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="jf-notification-empty">
          <Bell size={42} />

          <h3>No notifications yet</h3>

          <p>
            Notifications will appear when enabled
            alerts find matching jobs.
          </p>
        </div>
      ) : (
        <div className="jf-notification-list">
          {notifications.map(
            (notification) => (
              <article
                key={notification.id}
                className={
                  notification.read
                    ? "jf-notification-card read"
                    : "jf-notification-card unread"
                }
              >
                <div className="jf-notification-icon">
                  {notification.read ? (
                    <Check size={20} />
                  ) : (
                    <Bell size={20} />
                  )}
                </div>

                <div className="jf-notification-content">
                  <div className="jf-notification-title-row">
                    <div>
                      <p>
                        {notification.read
                          ? "Previously viewed"
                          : "New matching job"}
                      </p>

                      <h3>
                        {notification.title ||
                          "Matching job"}
                      </h3>
                    </div>

                    {!notification.read && (
                      <span className="jf-unread-dot">
                        New
                      </span>
                    )}
                  </div>

                  <strong className="jf-notification-company">
                    {notification.company ||
                      "Company unavailable"}
                  </strong>

                  <div className="jf-notification-meta">
                    <span>
                      <MapPin size={15} />
                      {notification.location ||
                        "Location unavailable"}
                    </span>

                    <span>
                      {notification.matchPercentage ??
                        0}
                      % match
                    </span>

                    <span>
                      {formatDate(
                        notification.createdAt
                      )}
                    </span>
                  </div>

                  <div className="jf-notification-actions">
                    {!notification.read ? (
                      <button
                        type="button"
                        className="jf-mark-read-button"
                        disabled={
                          busyNotificationId ===
                            notification.id ||
                          markingAll
                        }
                        onClick={() =>
                          handleMarkRead(
                            notification
                          )
                        }
                      >
                        {busyNotificationId ===
                        notification.id ? (
                          <Loader2
                            className="jf-spin"
                            size={16}
                          />
                        ) : (
                          <Check size={16} />
                        )}

                        Mark as read
                      </button>
                    ) : (
                      <span className="jf-read-label">
                        <Check size={15} />
                        Read
                      </span>
                    )}

                    {notification.applyUrl && (
                      <a
                        className="jf-notification-apply"
                        href={
                          notification.applyUrl
                        }
                        target="_blank"
                        rel="noreferrer"
                      >
                        Apply
                        <ExternalLink size={16} />
                      </a>
                    )}
                  </div>
                </div>
              </article>
            )
          )}
        </div>
      )}
    </section>
  );
};

export default NotificationsPanel;